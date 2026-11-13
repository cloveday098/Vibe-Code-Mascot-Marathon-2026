# Checkpoint System

A comprehensive checkpoint system with hooks that automatically creates markdown files for every completed prompt in your development workflow.

## Overview

The checkpoint system provides:
- **Automatic checkpoint creation** with comprehensive markdown documentation
- **File system monitoring** to track changes automatically
- **Command execution tracking** to capture development actions
- **Easy-to-use CLI** for manual checkpoint management
- **Decorator support** for function-level checkpointing
- **Search and indexing** capabilities for finding historical checkpoints

## Installation

1. **Install dependencies:**
   ```bash
   # Using uv (recommended for macOS)
   uv venv
   source .venv/bin/activate
   uv pip install -r requirements.txt

   # Or using pip
   pip install -r requirements.txt
   ```

2. **Verify installation:**
   ```bash
   python checkpoint_system.py
   ```

## Quick Start

### Basic Usage

```python
from checkpoint_system import start_prompt, add_action, add_file_change, create_checkpoint

# Start tracking a new prompt
start_prompt("Create a new React component")

# Add actions as you work
add_action("Created component file")
add_action("Added basic styling")

# Track file changes
add_file_change("src/components/NewComponent.jsx", "Created new React component", "created")

# Create checkpoint when done
create_checkpoint(
    prompt_text="Create a new React component",
    prompt_summary="Created new React component with TypeScript",
    results="Successfully created NewComponent.tsx with props interface"
)
```

### Using the Decorator

```python
from checkpoint_decorator import checkpoint

@checkpoint("Process user data", include_args=True, include_result=True)
def process_user_data(user_id: str, include_history: bool = False):
    # Your function logic here
    result = {"user_id": user_id, "processed": True}
    return result

# Function will automatically create a checkpoint when executed
process_user_data("user123", include_history=True)
```

### Using the CLI

```bash
# Create a manual checkpoint
python checkpoint_decorator.py create \
  --prompt "Fix authentication bug" \
  --summary "Fixed login timeout issue" \
  --results "Authentication now works correctly" \
  --issues "Timeout was too aggressive" \
  --next-steps "Add better error handling"

# List all checkpoints
python checkpoint_decorator.py list

# Search checkpoints
python checkpoint_decorator.py search "authentication"

# Show statistics
python checkpoint_decorator.py stats
```

## Components

### 1. Core Checkpoint System (`checkpoint_system.py`)

The core system manages:
- Checkpoint creation and storage
- Session tracking
- File indexing and searching
- Markdown generation

**Key Classes:**
- `CheckpointData`: Data structure for checkpoint information
- `CheckpointSystem`: Main checkpoint management system

**Key Functions:**
- `create_checkpoint()`: Create a new checkpoint
- `list_checkpoints()`: List existing checkpoints
- `search_checkpoints()`: Search checkpoint content

### 2. Hook System (`hooks.py`)

The hook system provides automatic monitoring:
- File system change detection
- Command execution tracking
- Custom event handling

**Key Classes:**
- `FileChangeHandler`: Monitors file system changes
- `CommandHook`: Tracks command executions
- `HookManager`: Manages all hooks

**Usage:**
```python
from hooks import install_hooks, uninstall_hooks

# Install hooks to start automatic tracking
install_hooks()

# Work as normal - changes and commands are tracked automatically

# Uninstall hooks when done
uninstall_hooks()
```

### 3. Decorator and CLI (`checkpoint_decorator.py`)

Provides easy-to-use interfaces:
- Function decorators for automatic checkpointing
- Command-line interface for manual management

**Decorator Options:**
- `prompt_summary`: Custom checkpoint summary
- `auto_track`: Enable automatic tracking
- `include_args`: Include function arguments
- `include_result`: Include function results

**CLI Commands:**
- `create`: Create manual checkpoint
- `list`: List checkpoints
- `search`: Search checkpoints
- `stats`: Show statistics
- `hooks`: Manage hook system

## Checkpoint Structure

Each checkpoint is a comprehensive markdown file containing:

### Example Checkpoint

```markdown
# checkpoint_001_20251115_113559

**Date**: 2025-11-15 11:35:59
**Session**: session_1763228159
**Prompt Summary**: Created data processing script with pandas

---

## Prompt Details

**Original Prompt**:
```
Create a new Python script for data processing
```

---

## Actions Taken

1. Created data_processor.py script
2. Added error handling

---

## Files Modified

- **data_processor.py** (modified)
  - Created initial script with data loading functions
  - Modified: 2025-11-15T11:35:59.843544

- **requirements.txt** (modified)
  - Added pandas dependency
  - Modified: 2025-11-15T11:35:59.843548

---

## Commands Executed

### `python data_processor.py --test`
**Exit Code**: 0
**Executed**: 2025-11-15T11:35:59.843550

```
Script executed successfully
```

---

## Results

Successfully created data_processor.py with error handling and data loading functions

---

## Issues Encountered

No issues were encountered.

---

## Next Steps

1. Add data validation
2. Create unit tests
3. Add documentation

---

## Context

No additional context recorded.

---

## Metadata

- **Checkpoint ID**: checkpoint_001_20251115_113559
- **Session ID**: session_1763228159
- **Created**: 2025-11-15 11:35:59
- **Total Actions**: 2
- **Files Modified**: 2
- **Commands Executed**: 1
```

## File Organization

```
.claude/skills/
├── checkpoints/              # Generated checkpoint files
│   ├── checkpoint_001_*.md   # Individual checkpoints
│   ├── checkpoint_002_*.md
│   └── index.json            # Checkpoint index
├── checkpoint_system.py      # Core checkpoint system
├── hooks.py                  # File and command monitoring
├── checkpoint_decorator.py   # Decorator and CLI
├── requirements.txt          # Dependencies
└── README.md                 # This documentation
```

## Configuration

### Environment Variables

- `CHECKPOINT_DIR`: Custom directory for checkpoints (default: `.claude/skills/checkpoints`)
- `CHECKPOINT_HOOKS_ENABLED`: Enable/disable automatic hooks (default: `true`)

### Customization

```python
# Custom checkpoint system configuration
from checkpoint_system import CheckpointSystem

system = CheckpointSystem(project_root="/path/to/project")

# Add custom hooks
def my_custom_hook(event_type, data):
    print(f"Custom hook: {event_type} - {data}")

system.register_hook('file_modified', my_custom_hook)
```

## Best Practices

### 1. Prompt Summaries
- Keep summaries concise but descriptive
- Include key technologies or components
- Example: "Created React TypeScript component with state management"

### 2. Context Tracking
- Add relevant context for future reference
- Include dependencies, design decisions, and constraints
- Example: `context={'framework': 'React', 'language': 'TypeScript', 'testing': 'Jest'}`

### 3. Issue Documentation
- Document any problems encountered
- Include error messages and debugging steps
- This creates valuable troubleshooting reference

### 4. Next Steps
- Always include next steps for continuity
- Be specific about what needs to be done next
- Include priority information if relevant

### 5. File Changes
- Be descriptive about what changed and why
- Include rationale for modifications
- Note any breaking changes or side effects

## Integration with Development Workflows

### Git Integration
```bash
# Create checkpoint before commits
python checkpoint_decorator.py create --prompt "$(git log -1 --pretty=%B)" --summary "Pre-commit checkpoint"

# Search for commits related to specific features
python checkpoint_decorator.py search "authentication"
```

### IDE Integration
Many IDEs can be configured to run commands:
- Set up keybindings for checkpoint creation
- Integrate with save actions
- Add to build/compile workflows

### Automated Testing
```python
@pytest.mark.checkpoint
def test_feature():
    with checkpoint("Test feature X"):
        # Test code here
        pass
```

## Troubleshooting

### Common Issues

1. **Watchdog Installation Error**
   ```bash
   # Use uv for macOS
   uv venv && source .venv/bin/activate
   uv pip install -r requirements.txt
   ```

2. **Permission Errors**
   - Ensure write permissions to `.claude/skills/checkpoints`
   - Check file system permissions

3. **Hook Conflicts**
   ```python
   # Uninstall hooks if needed
   from hooks import uninstall_hooks
   uninstall_hooks()
   ```

4. **Large Checkpoint Files**
   - Check for very large command outputs
   - Consider truncating long results

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable detailed logging for troubleshooting
```

## API Reference

### CheckpointSystem

#### Methods
- `start_prompt_tracking(prompt_text)`: Start tracking a new prompt
- `add_action(action)`: Add an action to current tracking
- `add_file_modification(path, description, type)`: Track file changes
- `add_command_execution(command, result, exit_code)`: Track commands
- `create_checkpoint(...)`: Create checkpoint from tracked data
- `list_checkpoints(session_id=None)`: List checkpoints
- `search_checkpoints(query)`: Search checkpoint content

### HookManager

#### Methods
- `install_all_hooks()`: Install all monitoring hooks
- `uninstall_all_hooks()`: Remove all monitoring hooks
- `add_custom_hook(event, callback)`: Add custom event handler
- `get_hook_status()`: Get current hook status

### Decorator

#### @checkpoint Options
- `prompt_summary`: Brief description (str)
- `auto_track`: Enable automatic tracking (bool)
- `include_args`: Include function arguments (bool)
- `include_result`: Include function result (bool)

## Contributing

To extend the checkpoint system:

1. **Add new hook types**: Extend the hook system for new event types
2. **Custom templates**: Modify markdown generation in `_generate_markdown()`
3. **Additional backends**: Add database or cloud storage support
4. **Integration plugins**: Create IDE or editor-specific integrations

## License

This checkpoint system is part of the project's development tooling.