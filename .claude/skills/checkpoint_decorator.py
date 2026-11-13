#!/usr/bin/env python3
"""
Checkpoint Decorator and CLI Interface
Easy-to-use decorators and command-line interface for checkpoint system.
"""

import functools
import inspect
import sys
import argparse
import json
from typing import Callable, Any, Optional, Dict, List
from pathlib import Path
from checkpoint_system import get_checkpoint_system
from hooks import get_hook_manager, install_hooks, uninstall_hooks


class CheckpointDecorator:
    """Decorator class for automatic checkpoint creation."""

    def __init__(self, prompt_summary: str = "", auto_track: bool = True,
                 include_args: bool = False, include_result: bool = True):
        """
        Initialize checkpoint decorator.

        Args:
            prompt_summary: Custom summary for the checkpoint
            auto_track: Whether to automatically track file changes and commands
            include_args: Whether to include function arguments in checkpoint
            include_result: Whether to include function result in checkpoint
        """
        self.prompt_summary = prompt_summary
        self.auto_track = auto_track
        self.include_args = include_args
        self.include_result = include_result

    def __call__(self, func: Callable) -> Callable:
        """Decorator implementation."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            checkpoint_system = get_checkpoint_system()

            # Generate prompt text from function
            func_name = func.__name__
            func_module = func.__module__
            prompt_text = f"Executing {func_module}.{func_name}"

            if self.include_args:
                try:
                    # Get function signature for better argument display
                    sig = inspect.signature(func)
                    bound_args = sig.bind(*args, **kwargs)
                    bound_args.apply_defaults()

                    arg_details = []
                    for name, value in bound_args.arguments.items():
                        if isinstance(value, (str, int, float, bool)):
                            arg_details.append(f"{name}={value}")
                        else:
                            arg_details.append(f"{name}={type(value).__name__}")

                    if arg_details:
                        prompt_text += f" with args: {', '.join(arg_details)}"
                except Exception:
                    # Fallback to simple argument representation
                    if args or kwargs:
                        prompt_text += f" with {len(args)} positional and {len(kwargs)} keyword arguments"

            # Start prompt tracking
            if self.auto_track:
                checkpoint_system.start_prompt_tracking(prompt_text)

            # Add initial action
            if self.auto_track:
                checkpoint_system.add_action(f"Started execution of {func_name}")

            try:
                # Execute the function
                result = func(*args, **kwargs)

                # Create checkpoint on success
                if self.auto_track:
                    checkpoint_system.add_action(f"Successfully completed {func_name}")

                    # Build results text
                    results = f"Function {func_name} completed successfully"
                    if self.include_result and result is not None:
                        if isinstance(result, (str, int, float, bool)):
                            results += f"\nResult: {result}"
                        elif isinstance(result, dict):
                            results += f"\nResult keys: {list(result.keys())}"
                        elif isinstance(result, list):
                            results += f"\nResult: list with {len(result)} items"
                        else:
                            results += f"\nResult type: {type(result).__name__}"

                    # Generate context
                    context = {
                        'function_name': func_name,
                        'module': func_module,
                        'decorator_used': True,
                        'auto_tracking': self.auto_track
                    }

                    if self.include_args:
                        try:
                            context['args_count'] = len(args)
                            context['kwargs_count'] = len(kwargs)
                        except Exception:
                            pass

                    # Create checkpoint
                    checkpoint_path = checkpoint_system.create_checkpoint(
                        prompt_text=prompt_text,
                        prompt_summary=self.prompt_summary or f"Executed {func_name}",
                        results=results,
                        context=context
                    )

                    print(f"📝 Checkpoint created: {checkpoint_path}")

                return result

            except Exception as e:
                # Track error and create error checkpoint
                if self.auto_track:
                    checkpoint_system.add_action(f"Error in {func_name}: {str(e)}")

                    error_context = {
                        'function_name': func_name,
                        'module': func_module,
                        'error_type': type(e).__name__,
                        'error_message': str(e),
                        'decorator_used': True
                    }

                    checkpoint_system.create_checkpoint(
                        prompt_text=prompt_text,
                        prompt_summary=f"Error in {func_name}",
                        results=f"Function {func_name} failed with error: {str(e)}",
                        issues=[f"{type(e).__name__}: {str(e)}"],
                        context=error_context
                    )

                raise

        return wrapper


def checkpoint(prompt_summary: str = "", auto_track: bool = True,
              include_args: bool = False, include_result: bool = True):
    """
    Decorator for automatic checkpoint creation.

    Usage:
        @checkpoint("Process user data")
        def process_user_data(user_id):
            # Function code here
            return result

        @checkpoint(auto_track=False)
        def manual_checkpoint_function():
            # Manual checkpoint creation needed
            pass
    """
    return CheckpointDecorator(
        prompt_summary=prompt_summary,
        auto_track=auto_track,
        include_args=include_args,
        include_result=include_result
    )


class CheckpointCLI:
    """Command-line interface for checkpoint system."""

    def __init__(self):
        self.checkpoint_system = get_checkpoint_system()
        self.hook_manager = get_hook_manager()

    def create_parser(self) -> argparse.ArgumentParser:
        """Create command-line argument parser."""
        parser = argparse.ArgumentParser(
            description="Checkpoint System CLI - Track and manage development checkpoints"
        )

        subparsers = parser.add_subparsers(dest='command', help='Available commands')

        # Create checkpoint command
        create_parser = subparsers.add_parser('create', help='Create a manual checkpoint')
        create_parser.add_argument('--prompt', '-p', required=True, help='Prompt text')
        create_parser.add_argument('--summary', '-s', help='Brief summary')
        create_parser.add_argument('--results', '-r', help='Results achieved')
        create_parser.add_argument('--issues', '-i', nargs='*', help='Issues encountered')
        create_parser.add_argument('--next-steps', '-n', nargs='*', help='Next steps')

        # List checkpoints command
        list_parser = subparsers.add_parser('list', help='List checkpoints')
        list_parser.add_argument('--session', help='Filter by session ID')
        list_parser.add_argument('--format', choices=['table', 'json'], default='table',
                               help='Output format')

        # Search checkpoints command
        search_parser = subparsers.add_parser('search', help='Search checkpoints')
        search_parser.add_argument('query', help='Search query')
        search_parser.add_argument('--format', choices=['table', 'json'], default='table',
                                 help='Output format')

        # Hooks management
        hooks_parser = subparsers.add_parser('hooks', help='Manage hooks')
        hooks_subparsers = hooks_parser.add_subparsers(dest='hooks_action')

        hooks_subparsers.add_parser('install', help='Install checkpoint hooks')
        hooks_subparsers.add_parser('uninstall', help='Uninstall checkpoint hooks')
        hooks_subparsers.add_parser('status', help='Show hooks status')

        # Stats command
        stats_parser = subparsers.add_parser('stats', help='Show checkpoint statistics')

        return parser

    def run(self, args: Optional[List[str]] = None):
        """Run the CLI with given arguments."""
        parser = self.create_parser()
        parsed_args = parser.parse_args(args)

        if not parsed_args.command:
            parser.print_help()
            return

        try:
            if parsed_args.command == 'create':
                self._create_checkpoint(parsed_args)
            elif parsed_args.command == 'list':
                self._list_checkpoints(parsed_args)
            elif parsed_args.command == 'search':
                self._search_checkpoints(parsed_args)
            elif parsed_args.command == 'hooks':
                self._manage_hooks(parsed_args)
            elif parsed_args.command == 'stats':
                self._show_stats()
            else:
                parser.print_help()
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)

    def _create_checkpoint(self, args):
        """Create a manual checkpoint."""
        context = {
            'manual_creation': True,
            'cli_used': True
        }

        checkpoint_path = self.checkpoint_system.create_checkpoint(
            prompt_text=args.prompt,
            prompt_summary=args.summary or "",
            results=args.results or "",
            issues=args.issues or [],
            next_steps=args.next_steps or [],
            context=context
        )

        print(f"✅ Checkpoint created: {checkpoint_path}")

    def _list_checkpoints(self, args):
        """List checkpoints."""
        checkpoints = self.checkpoint_system.list_checkpoints(args.session)

        if not checkpoints:
            print("No checkpoints found.")
            return

        if args.format == 'json':
            print(json.dumps(checkpoints, indent=2))
        else:
            print(f"{'ID':<20} {'Filename':<40} {'Timestamp':<20}")
            print("-" * 80)
            for cp in checkpoints:
                print(f"{cp['checkpoint_id']:<20} {cp['filename']:<40} {cp['timestamp']:<20}")

    def _search_checkpoints(self, args):
        """Search checkpoints."""
        results = self.checkpoint_system.search_checkpoints(args.query)

        if not results:
            print(f"No checkpoints found matching '{args.query}'.")
            return

        if args.format == 'json':
            print(json.dumps(results, indent=2))
        else:
            print(f"Found {len(results)} checkpoints matching '{args.query}':\n")
            for result in results:
                print(f"📄 {result['filename']} ({result['matches']} matches)")
                print(f"   Path: {result['filepath']}")
                print()

    def _manage_hooks(self, args):
        """Manage checkpoint hooks."""
        if args.hooks_action == 'install':
            install_hooks()
        elif args.hooks_action == 'uninstall':
            uninstall_hooks()
        elif args.hooks_action == 'status':
            status = self.hook_manager.get_hook_status()
            print("Checkpoint Hooks Status:")
            print(f"  Installed: {'✅' if status['hooks_installed'] else '❌'}")
            print(f"  File Monitoring: {'✅' if status['file_monitoring_active'] else '❌'}")
            print(f"  Project Root: {status['project_root']}")
            print(f"  Total Checkpoints: {status['checkpoint_count']}")
        else:
            print("Unknown hooks action. Available: install, uninstall, status")

    def _show_stats(self):
        """Show checkpoint statistics."""
        checkpoints = self.checkpoint_system.list_checkpoints()
        latest = self.checkpoint_system.get_latest_checkpoint()

        print("Checkpoint System Statistics:")
        print(f"  Total Checkpoints: {len(checkpoints)}")
        print(f"  Checkpoints Directory: {self.checkpoint_system.checkpoints_dir}")

        if latest:
            print(f"  Latest Checkpoint: {latest['id']}")
            print(f"  Latest Timestamp: {latest['timestamp']}")
        else:
            print("  No checkpoints created yet.")

        # Checkpoints by session
        sessions = {}
        for cp in checkpoints:
            session_id = cp['session_id']
            if session_id not in sessions:
                sessions[session_id] = 0
            sessions[session_id] += 1

        print(f"  Active Sessions: {len(sessions)}")
        for session_id, count in sessions.items():
            print(f"    {session_id}: {count} checkpoints")


def main():
    """Main CLI entry point."""
    cli = CheckpointCLI()
    cli.run()


if __name__ == "__main__":
    main()