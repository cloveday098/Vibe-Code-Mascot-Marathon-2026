#!/usr/bin/env python3
"""
Hook System for Checkpoint Integration
Monitors file changes and command executions for automatic checkpoint generation.
"""

import os
import sys
import json
import time
import subprocess
import threading
from typing import Dict, List, Callable, Optional, Any
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import atexit
from checkpoint_system import get_checkpoint_system


class FileChangeHandler(FileSystemEventHandler):
    """Handles file system change events for checkpoint tracking."""

    def __init__(self, checkpoint_system, ignore_patterns: List[str] = None):
        self.checkpoint_system = checkpoint_system
        self.ignore_patterns = ignore_patterns or [
            '.git', '__pycache__', '.pytest_cache', 'node_modules',
            '.DS_Store', '*.pyc', '.env'
        ]
        self.debounce_timer = None
        self.pending_changes = {}

    def should_ignore(self, file_path: str) -> bool:
        """Check if file should be ignored based on patterns."""
        for pattern in self.ignore_patterns:
            if pattern in file_path:
                return True
        return False

    def on_modified(self, event):
        """Handle file modification events."""
        if event.is_directory or self.should_ignore(event.src_path):
            return

        # Debounce rapid changes
        file_path = event.src_path
        self.pending_changes[file_path] = {
            'type': 'modified',
            'timestamp': time.time(),
            'path': file_path
        }

        # Cancel existing timer
        if self.debounce_timer:
            self.debounce_timer.cancel()

        # Set new timer to process changes
        self.debounce_timer = threading.Timer(1.0, self._process_pending_changes)
        self.debounce_timer.start()

    def on_created(self, event):
        """Handle file creation events."""
        if event.is_directory or self.should_ignore(event.src_path):
            return

        file_path = event.src_path
        self.pending_changes[file_path] = {
            'type': 'created',
            'timestamp': time.time(),
            'path': file_path
        }

        if self.debounce_timer:
            self.debounce_timer.cancel()

        self.debounce_timer = threading.Timer(1.0, self._process_pending_changes)
        self.debounce_timer.start()

    def on_deleted(self, event):
        """Handle file deletion events."""
        if event.is_directory or self.should_ignore(event.src_path):
            return

        file_path = event.src_path
        self.checkpoint_system.add_file_modification(
            file_path,
            f"File deleted: {os.path.basename(file_path)}",
            "deleted"
        )

    def _process_pending_changes(self):
        """Process all pending file changes."""
        for file_path, change_info in self.pending_changes.items():
            try:
                # Get relative path from project root
                rel_path = os.path.relpath(file_path, self.checkpoint_system.project_root)

                # Determine change description based on file type
                description = self._get_change_description(file_path, change_info['type'])

                self.checkpoint_system.add_file_modification(
                    rel_path,
                    description,
                    change_info['type']
                )
            except Exception as e:
                print(f"Error processing file change {file_path}: {e}")

        self.pending_changes.clear()
        self.debounce_timer = None

    def _get_change_description(self, file_path: str, change_type: str) -> str:
        """Generate appropriate description for file change."""
        filename = os.path.basename(file_path)
        ext = os.path.splitext(filename)[1].lower()

        if change_type == 'created':
            return f"Created new {self._get_file_type_description(ext)}: {filename}"
        elif change_type == 'modified':
            return f"Updated {self._get_file_type_description(ext)}: {filename}"
        else:
            return f"Modified file: {filename}"

    def _get_file_type_description(self, extension: str) -> str:
        """Get human-readable description of file type."""
        type_map = {
            '.py': 'Python script',
            '.js': 'JavaScript file',
            '.ts': 'TypeScript file',
            '.jsx': 'React component',
            '.tsx': 'TypeScript React component',
            '.md': 'Markdown document',
            '.json': 'JSON configuration',
            '.yaml': 'YAML configuration',
            '.yml': 'YAML configuration',
            '.txt': 'text file',
            '.sh': 'shell script',
            '.bash': 'bash script',
            '.zsh': 'zsh script',
            '.html': 'HTML file',
            '.css': 'CSS stylesheet',
            '.scss': 'SCSS stylesheet',
            '.sql': 'SQL query file',
            '.dockerfile': 'Docker configuration',
            '.yml': 'YAML file',
        }
        return type_map.get(extension, 'file')


class CommandHook:
    """Hooks for monitoring command executions."""

    def __init__(self, checkpoint_system):
        self.checkpoint_system = checkpoint_system
        self.original_subprocess_run = subprocess.run
        self.original_subprocess_call = subprocess.call
        self.original_subprocess_check_call = subprocess.check_call
        self.original_subprocess_check_output = subprocess.check_output
        self.original_os_system = os.system

    def install_hooks(self):
        """Install command execution hooks."""
        subprocess.run = self._hooked_run
        subprocess.call = self._hooked_call
        subprocess.check_call = self._hooked_check_call
        subprocess.check_output = self._hooked_check_output
        os.system = self._hooked_system

    def uninstall_hooks(self):
        """Uninstall command execution hooks."""
        subprocess.run = self.original_subprocess_run
        subprocess.call = self.original_subprocess_call
        subprocess.check_call = self.original_subprocess_check_call
        subprocess.check_output = self.original_subprocess_check_output
        os.system = self.original_os_system

    def _hooked_run(self, *args, **kwargs):
        """Hook for subprocess.run."""
        return self._execute_command('subprocess.run', *args, **kwargs)

    def _hooked_call(self, *args, **kwargs):
        """Hook for subprocess.call."""
        return self._execute_command('subprocess.call', *args, **kwargs)

    def _hooked_check_call(self, *args, **kwargs):
        """Hook for subprocess.check_call."""
        return self._execute_command('subprocess.check_call', *args, **kwargs)

    def _hooked_check_output(self, *args, **kwargs):
        """Hook for subprocess.check_output."""
        return self._execute_command('subprocess.check_output', *args, **kwargs)

    def _hooked_system(self, command):
        """Hook for os.system."""
        return self._execute_command('os.system', command)

    def _execute_command(self, method_name: str, *args, **kwargs):
        """Execute command and track it in checkpoint system."""
        # Build command string for logging
        command_str = self._build_command_string(*args, **kwargs)

        try:
            # Execute the original command
            if method_name == 'os.system':
                result = self.original_os_system(*args)
                exit_code = result
                output = ""
            else:
                original_func = getattr(self.original_subprocess_run.__self__, method_name.split('.')[-1])

                # Handle different subprocess methods
                if 'check_output' in method_name:
                    result = original_func(*args, **kwargs)
                    exit_code = 0
                    output = str(result) if result else ""
                else:
                    result = original_func(*args, **kwargs)
                    exit_code = result.returncode if hasattr(result, 'returncode') else 0
                    output = ""

            # Track the command
            self.checkpoint_system.add_command_execution(
                command=command_str,
                result=output or f"Command completed with exit code {exit_code}",
                exit_code=exit_code
            )

            return result

        except Exception as e:
            # Track failed commands
            self.checkpoint_system.add_command_execution(
                command=command_str,
                result=f"Command failed: {str(e)}",
                exit_code=1
            )
            raise

    def _build_command_string(self, *args, **kwargs) -> str:
        """Build a readable command string from args and kwargs."""
        if args:
            if isinstance(args[0], str):
                return args[0]
            elif isinstance(args[0], list):
                return ' '.join(args[0])
        return str(args)


class HookManager:
    """Manages all checkpoint hooks."""

    def __init__(self, project_root: Optional[str] = None):
        self.checkpoint_system = get_checkpoint_system()
        self.project_root = project_root or Path.cwd()

        # File system monitoring
        self.file_handler = FileChangeHandler(self.checkpoint_system)
        self.observer = Observer()

        # Command monitoring
        self.command_hook = CommandHook(self.checkpoint_system)

        # Hook state
        self.hooks_installed = False
        self.monitoring_active = False

    def install_all_hooks(self):
        """Install all checkpoint hooks."""
        if self.hooks_installed:
            return

        # Install command hooks
        self.command_hook.install_hooks()

        # Install file system monitoring
        self.observer.schedule(self.file_handler, str(self.project_root), recursive=True)
        self.observer.start()
        self.monitoring_active = True

        # Register cleanup on exit
        atexit.register(self.cleanup)

        self.hooks_installed = True
        print("✅ Checkpoint hooks installed successfully")

    def uninstall_all_hooks(self):
        """Uninstall all checkpoint hooks."""
        if not self.hooks_installed:
            return

        # Uninstall command hooks
        self.command_hook.uninstall_hooks()

        # Stop file system monitoring
        if self.monitoring_active:
            self.observer.stop()
            self.observer.join()
            self.monitoring_active = False

        self.hooks_installed = False
        print("✅ Checkpoint hooks uninstalled")

    def cleanup(self):
        """Cleanup resources."""
        self.uninstall_all_hooks()

    def add_custom_hook(self, event: str, callback: Callable):
        """Add a custom hook for checkpoint events."""
        self.checkpoint_system.register_hook(event, callback)

    def get_hook_status(self) -> Dict[str, Any]:
        """Get current hook status."""
        return {
            'hooks_installed': self.hooks_installed,
            'file_monitoring_active': self.monitoring_active,
            'project_root': str(self.project_root),
            'checkpoint_count': len(self.checkpoint_system._get_existing_checkpoints())
        }


# Global hook manager instance
_hook_manager = None


def get_hook_manager() -> HookManager:
    """Get the global hook manager instance."""
    global _hook_manager
    if _hook_manager is None:
        _hook_manager = HookManager()
    return _hook_manager


def install_hooks():
    """Install all checkpoint hooks."""
    get_hook_manager().install_all_hooks()


def uninstall_hooks():
    """Uninstall all checkpoint hooks."""
    get_hook_manager().uninstall_all_hooks()


def add_custom_hook(event: str, callback: Callable):
    """Add a custom hook."""
    get_hook_manager().add_custom_hook(event, callback)


def get_hook_status() -> Dict[str, Any]:
    """Get hook status."""
    return get_hook_manager().get_hook_status()


if __name__ == "__main__":
    # Example usage
    import time

    # Install hooks
    install_hooks()

    print("Hooks installed. Making some test changes...")

    # Test file changes
    test_file = Path("test_hook_file.txt")
    test_file.write_text("This is a test file for hooks")

    time.sleep(2)

    test_file.write_text("This is updated content")

    # Test command execution
    result = subprocess.run(["echo", "Hello from hooks"], capture_output=True, text=True)

    time.sleep(2)

    # Clean up
    test_file.unlink()

    # Create a checkpoint
    checkpoint_system = get_checkpoint_system()
    checkpoint_path = checkpoint_system.create_checkpoint(
        prompt_text="Test hook system functionality",
        prompt_summary="Testing file and command hooks",
        results="Successfully tested file monitoring and command execution hooks"
    )

    print(f"Test checkpoint created at: {checkpoint_path}")

    # Cleanup
    uninstall_hooks()