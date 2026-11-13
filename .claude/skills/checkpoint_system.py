#!/usr/bin/env python3
"""
Comprehensive Checkpoint System with Hooks
Automatically creates markdown checkpoints for every completed prompt.
"""

import os
import json
import time
import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import subprocess
import sys


@dataclass
class CheckpointData:
    """Data structure for checkpoint information."""
    checkpoint_id: str
    timestamp: str
    prompt_summary: str
    prompt_text: str
    actions_taken: List[str]
    files_modified: List[Dict[str, str]]
    commands_executed: List[Dict[str, Any]]
    results: str
    issues: List[str]
    next_steps: List[str]
    context: Dict[str, Any]
    session_id: str


class CheckpointSystem:
    """
    Comprehensive checkpoint system with hooks for automatic prompt completion detection.
    """

    def __init__(self, project_root: Optional[str] = None):
        """Initialize the checkpoint system."""
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.checkpoints_dir = self.project_root / ".claude" / "skills" / "checkpoints"
        self.checkpoints_dir.mkdir(parents=True, exist_ok=True)

        # Session tracking
        self.session_id = self._generate_session_id()
        self.current_prompt_start = None
        self.pending_actions = []
        self.pending_files = []
        self.pending_commands = []

        # Hook registry
        self.hooks = {
            'pre_prompt': [],
            'post_prompt': [],
            'file_modified': [],
            'command_executed': [],
            'error_occurred': []
        }

        # Load existing checkpoints index
        self.checkpoints_index = self._load_checkpoints_index()

    def _generate_session_id(self) -> str:
        """Generate a unique session ID."""
        timestamp = int(time.time())
        return f"session_{timestamp}"

    def _generate_checkpoint_id(self) -> str:
        """Generate a unique checkpoint ID."""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        count = len(self._get_existing_checkpoints()) + 1
        return f"checkpoint_{count:03d}_{timestamp}"

    def _get_existing_checkpoints(self) -> List[str]:
        """Get list of existing checkpoint files."""
        return [f for f in os.listdir(self.checkpoints_dir) if f.endswith('.md')]

    def _load_checkpoints_index(self) -> Dict[str, Any]:
        """Load or create checkpoints index file."""
        index_file = self.checkpoints_dir / "index.json"
        if index_file.exists():
            with open(index_file, 'r') as f:
                return json.load(f)
        return {
            'total_checkpoints': 0,
            'sessions': {},
            'last_checkpoint': None
        }

    def _save_checkpoints_index(self):
        """Save checkpoints index to file."""
        index_file = self.checkpoints_dir / "index.json"
        with open(index_file, 'w') as f:
            json.dump(self.checkpoints_index, f, indent=2)

    def register_hook(self, event: str, callback):
        """Register a hook for specific events."""
        if event in self.hooks:
            self.hooks[event].append(callback)

    def _execute_hooks(self, event: str, *args, **kwargs):
        """Execute all registered hooks for an event."""
        for hook in self.hooks[event]:
            try:
                hook(*args, **kwargs)
            except Exception as e:
                print(f"Hook error for {event}: {e}")

    def start_prompt_tracking(self, prompt_text: str):
        """Start tracking a new prompt."""
        self.current_prompt_start = datetime.datetime.now()
        self.pending_actions = []
        self.pending_files = []
        self.pending_commands = []

        # Execute pre-prompt hooks
        self._execute_hooks('pre_prompt', prompt_text, self.current_prompt_start)

    def add_action(self, action: str):
        """Add an action to the current prompt tracking."""
        self.pending_actions.append(action)

    def add_file_modification(self, file_path: str, description: str, change_type: str = "modified"):
        """Add a file modification to the current prompt tracking."""
        self.pending_files.append({
            'path': file_path,
            'description': description,
            'type': change_type,
            'timestamp': datetime.datetime.now().isoformat()
        })
        self._execute_hooks('file_modified', file_path, description, change_type)

    def add_command_execution(self, command: str, result: str, exit_code: int = 0):
        """Add a command execution to the current prompt tracking."""
        self.pending_commands.append({
            'command': command,
            'result': result,
            'exit_code': exit_code,
            'timestamp': datetime.datetime.now().isoformat()
        })
        self._execute_hooks('command_executed', command, result, exit_code)

    def create_checkpoint(self, prompt_text: str, prompt_summary: str = "",
                         results: str = "", issues: List[str] = None,
                         next_steps: List[str] = None, context: Dict[str, Any] = None) -> str:
        """
        Create a comprehensive checkpoint for the completed prompt.

        Args:
            prompt_text: The full text of the prompt
            prompt_summary: Brief summary of the prompt
            results: Results achieved
            issues: Any issues encountered
            next_steps: Next steps to take
            context: Additional context information

        Returns:
            The checkpoint file path
        """
        checkpoint_id = self._generate_checkpoint_id()
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Create checkpoint data
        checkpoint_data = CheckpointData(
            checkpoint_id=checkpoint_id,
            timestamp=timestamp,
            prompt_summary=prompt_summary or prompt_text[:100] + "...",
            prompt_text=prompt_text,
            actions_taken=self.pending_actions.copy(),
            files_modified=self.pending_files.copy(),
            commands_executed=self.pending_commands.copy(),
            results=results,
            issues=issues or [],
            next_steps=next_steps or [],
            context=context or {},
            session_id=self.session_id
        )

        # Generate markdown content
        markdown_content = self._generate_markdown(checkpoint_data)

        # Write checkpoint file
        filename = f"{checkpoint_id}.md"
        filepath = self.checkpoints_dir / filename

        with open(filepath, 'w') as f:
            f.write(markdown_content)

        # Update index
        self._update_index(checkpoint_data, filename)

        # Execute post-prompt hooks
        self._execute_hooks('post_prompt', checkpoint_data)

        # Reset tracking
        self.current_prompt_start = None
        self.pending_actions = []
        self.pending_files = []
        self.pending_commands = []

        print(f"✅ Checkpoint created: {filepath}")
        return str(filepath)

    def _generate_markdown(self, data: CheckpointData) -> str:
        """Generate comprehensive markdown content for checkpoint."""
        content = f"""# {data.checkpoint_id}

**Date**: {data.timestamp}
**Session**: {data.session_id}
**Prompt Summary**: {data.prompt_summary}

---

## Prompt Details

**Original Prompt**:
```
{data.prompt_text}
```

---

## Actions Taken

"""

        if data.actions_taken:
            for i, action in enumerate(data.actions_taken, 1):
                content += f"{i}. {action}\n"
        else:
            content += "No specific actions recorded.\n"

        content += "\n---\n\n## Files Modified\n\n"

        if data.files_modified:
            for file_info in data.files_modified:
                content += f"- **{file_info['path']}** ({file_info['type']})\n"
                content += f"  - {file_info['description']}\n"
                content += f"  - Modified: {file_info['timestamp']}\n\n"
        else:
            content += "No files were modified.\n"

        content += "---\n\n## Commands Executed\n\n"

        if data.commands_executed:
            for cmd_info in data.commands_executed:
                content += f"### `{cmd_info['command']}`\n"
                content += f"**Exit Code**: {cmd_info['exit_code']}\n"
                content += f"**Executed**: {cmd_info['timestamp']}\n\n"
                content += "```\n"
                content += cmd_info['result'][:500] + ("..." if len(cmd_info['result']) > 500 else "")
                content += "\n```\n\n"
        else:
            content += "No commands were executed.\n"

        content += "---\n\n## Results\n\n"
        content += data.results or "No specific results recorded.\n"

        content += "\n---\n\n## Issues Encountered\n\n"

        if data.issues:
            for i, issue in enumerate(data.issues, 1):
                content += f"{i}. {issue}\n"
        else:
            content += "No issues were encountered.\n"

        content += "\n---\n\n## Next Steps\n\n"

        if data.next_steps:
            for i, step in enumerate(data.next_steps, 1):
                content += f"{i}. {step}\n"
        else:
            content += "No specific next steps identified.\n"

        content += "\n---\n\n## Context\n\n"

        if data.context:
            for key, value in data.context.items():
                content += f"**{key}**: {value}\n"
        else:
            content += "No additional context recorded.\n"

        content += "\n---\n\n## Metadata\n\n"
        content += f"- **Checkpoint ID**: {data.checkpoint_id}\n"
        content += f"- **Session ID**: {data.session_id}\n"
        content += f"- **Created**: {data.timestamp}\n"
        content += f"- **Total Actions**: {len(data.actions_taken)}\n"
        content += f"- **Files Modified**: {len(data.files_modified)}\n"
        content += f"- **Commands Executed**: {len(data.commands_executed)}\n"

        return content

    def _update_index(self, data: CheckpointData, filename: str):
        """Update the checkpoints index."""
        self.checkpoints_index['total_checkpoints'] += 1
        self.checkpoints_index['last_checkpoint'] = {
            'id': data.checkpoint_id,
            'filename': filename,
            'timestamp': data.timestamp,
            'session_id': data.session_id
        }

        if data.session_id not in self.checkpoints_index['sessions']:
            self.checkpoints_index['sessions'][data.session_id] = []

        self.checkpoints_index['sessions'][data.session_id].append({
            'checkpoint_id': data.checkpoint_id,
            'filename': filename,
            'timestamp': data.timestamp
        })

        self._save_checkpoints_index()

    def list_checkpoints(self, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all checkpoints, optionally filtered by session."""
        if session_id:
            return self.checkpoints_index['sessions'].get(session_id, [])

        all_checkpoints = []
        for session_checkpoints in self.checkpoints_index['sessions'].values():
            all_checkpoints.extend(session_checkpoints)

        return sorted(all_checkpoints, key=lambda x: x['timestamp'])

    def get_latest_checkpoint(self) -> Optional[Dict[str, Any]]:
        """Get the most recent checkpoint."""
        return self.checkpoints_index.get('last_checkpoint')

    def search_checkpoints(self, query: str) -> List[Dict[str, Any]]:
        """Search checkpoints by content."""
        results = []
        for checkpoint_file in self._get_existing_checkpoints():
            filepath = self.checkpoints_dir / checkpoint_file
            try:
                with open(filepath, 'r') as f:
                    content = f.read().lower()
                    if query.lower() in content:
                        results.append({
                            'filename': checkpoint_file,
                            'filepath': str(filepath),
                            'matches': content.count(query.lower())
                        })
            except Exception as e:
                print(f"Error searching {checkpoint_file}: {e}")

        return sorted(results, key=lambda x: x['matches'], reverse=True)


# Global checkpoint system instance
_checkpoint_system = None


def get_checkpoint_system() -> CheckpointSystem:
    """Get the global checkpoint system instance."""
    global _checkpoint_system
    if _checkpoint_system is None:
        _checkpoint_system = CheckpointSystem()
    return _checkpoint_system


# Convenience functions for easy access
def start_prompt(prompt_text: str):
    """Start tracking a new prompt."""
    get_checkpoint_system().start_prompt_tracking(prompt_text)


def add_action(action: str):
    """Add an action to the current prompt."""
    get_checkpoint_system().add_action(action)


def add_file_change(file_path: str, description: str, change_type: str = "modified"):
    """Add a file modification to the current prompt."""
    get_checkpoint_system().add_file_modification(file_path, description, change_type)


def add_command(command: str, result: str, exit_code: int = 0):
    """Add a command execution to the current prompt."""
    get_checkpoint_system().add_command_execution(command, result, exit_code)


def create_checkpoint(prompt_text: str, prompt_summary: str = "",
                     results: str = "", issues: List[str] = None,
                     next_steps: List[str] = None, context: Dict[str, Any] = None) -> str:
    """Create a checkpoint for the completed prompt."""
    return get_checkpoint_system().create_checkpoint(
        prompt_text, prompt_summary, results, issues, next_steps, context
    )


def list_checkpoints(session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """List checkpoints."""
    return get_checkpoint_system().list_checkpoints(session_id)


def search_checkpoints(query: str) -> List[Dict[str, Any]]:
    """Search checkpoints."""
    return get_checkpoint_system().search_checkpoints(query)


if __name__ == "__main__":
    # Example usage
    system = CheckpointSystem()

    # Start tracking a prompt
    system.start_prompt_tracking("Create a new Python script for data processing")

    # Add some actions
    system.add_action("Created data_processor.py script")
    system.add_action("Added error handling")

    # Add file modifications
    system.add_file_modification("data_processor.py", "Created initial script with data loading functions")
    system.add_file_modification("requirements.txt", "Added pandas dependency")

    # Add command executions
    system.add_command_execution("python data_processor.py --test", "Script executed successfully", 0)

    # Create checkpoint
    checkpoint_path = system.create_checkpoint(
        prompt_text="Create a new Python script for data processing",
        prompt_summary="Created data processing script with pandas",
        results="Successfully created data_processor.py with error handling and data loading functions",
        next_steps=["Add data validation", "Create unit tests", "Add documentation"]
    )

    print(f"Checkpoint created at: {checkpoint_path}")