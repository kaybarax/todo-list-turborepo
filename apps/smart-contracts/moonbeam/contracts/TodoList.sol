// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TodoList
 * @dev A smart contract for managing todo items on the Moonbeam blockchain
 * @notice This contract is deployed on Moonbeam, a Polkadot parachain with full Ethereum compatibility
 */
contract TodoList is Ownable {
  // Enum for todo priority
  enum Priority {
    Low,
    Medium,
    High
  }

  // Struct for todo item
  struct Todo {
    uint256 id;
    string title;
    string description;
    bool completed;
    Priority priority;
    uint256 createdAt;
    uint256 updatedAt;
    uint256 completedAt;
  }

  // Struct for todo statistics
  struct TodoStats {
    uint256 total;
    uint256 completed;
    uint256 pending;
    uint256 highPriority;
  }

  // Maximum length for todo title
  uint256 public constant MAX_TITLE_LENGTH = 100;

  // Maximum length for todo description
  uint256 public constant MAX_DESCRIPTION_LENGTH = 500;

  // Maximum number of todos per user
  uint256 public constant MAX_TODOS_PER_USER = 50;

  // Mapping from user address to their todos
  mapping(address => Todo[]) private _userTodos;

  // Mapping from user address to their todo IDs
  mapping(address => mapping(uint256 => uint256)) private _todoIndexes;

  // Counter for todo IDs
  mapping(address => uint256) private _todoIds;

  // Events
  event TodoCreated(address indexed user, uint256 indexed id, string title, Priority priority);
  event TodoUpdated(address indexed user, uint256 indexed id, string title, Priority priority);
  event TodoCompletionToggled(address indexed user, uint256 indexed id, bool completed);
  event TodoDeleted(address indexed user, uint256 indexed id);

  // Custom errors
  error TitleEmpty();
  error TitleTooLong();
  error DescriptionTooLong();
  error TodoListFull();
  error TodoNotFound();
  error InvalidPriority();

  /**
   * @dev Constructor that sets the contract owner
   */
  constructor() Ownable(msg.sender) {}

  /**
   * @dev Create a new todo
   * @param title The title of the todo
   * @param description The description of the todo
   * @param priority The priority of the todo (0=Low, 1=Medium, 2=High)
   * @return id The ID of the created todo
   */
  function createTodo(
    string calldata title,
    string calldata description,
    Priority priority
  ) external returns (uint256) {
    // Check title length
    if (bytes(title).length == 0) revert TitleEmpty();
    if (bytes(title).length > MAX_TITLE_LENGTH) revert TitleTooLong();

    // Check description length
    if (bytes(description).length > MAX_DESCRIPTION_LENGTH) revert DescriptionTooLong();

    // Check todo list size
    if (_userTodos[msg.sender].length >= MAX_TODOS_PER_USER) revert TodoListFull();

    // Get next ID
    _todoIds[msg.sender]++;
    uint256 todoId = _todoIds[msg.sender];

    // Create new todo
    // solhint-disable-next-line not-rely-on-time
    Todo memory newTodo = Todo({
      id: todoId,
      title: title,
      description: description,
      completed: false,
      priority: priority,
      createdAt: block.timestamp, // solhint-disable-line not-rely-on-time
      updatedAt: block.timestamp, // solhint-disable-line not-rely-on-time
      completedAt: 0
    });

    // Add todo to user's list
    _userTodos[msg.sender].push(newTodo);

    // Store the index of the todo in the array
    _todoIndexes[msg.sender][todoId] = _userTodos[msg.sender].length - 1;

    // Emit event
    emit TodoCreated(msg.sender, todoId, title, priority);

    return todoId;
  }

  /**
   * @dev Update an existing todo
   * @param id The ID of the todo to update
   * @param title The new title (pass empty string to keep current)
   * @param description The new description (pass empty string to keep current)
   * @param priorityValue The new priority (pass uint256 max value to keep current)
   */
  function updateTodo(uint256 id, string calldata title, string calldata description, uint256 priorityValue) external {
    // Get todo index
    uint256 index = _getTodoIndex(msg.sender, id);

    // Check title length if provided
    if (bytes(title).length > 0) {
      if (bytes(title).length > MAX_TITLE_LENGTH) revert TitleTooLong();
      _userTodos[msg.sender][index].title = title;
    }

    // Check description length if provided
    if (bytes(description).length > 0) {
      if (bytes(description).length > MAX_DESCRIPTION_LENGTH) revert DescriptionTooLong();
      _userTodos[msg.sender][index].description = description;
    }

    // Update priority if provided
    if (priorityValue != type(uint256).max) {
      if (priorityValue > uint256(Priority.High)) revert InvalidPriority();
      _userTodos[msg.sender][index].priority = Priority(priorityValue);
    }

    // Update timestamp
    // solhint-disable-next-line not-rely-on-time
    _userTodos[msg.sender][index].updatedAt = block.timestamp;

    // Emit event
    emit TodoUpdated(msg.sender, id, _userTodos[msg.sender][index].title, _userTodos[msg.sender][index].priority);
  }

  /**
   * @dev Toggle the completion status of a todo
   * @param id The ID of the todo to toggle
   */
  function toggleTodoCompletion(uint256 id) external {
    // Get todo index
    uint256 index = _getTodoIndex(msg.sender, id);

    // Toggle completion status
    _userTodos[msg.sender][index].completed = !_userTodos[msg.sender][index].completed;

    // Update timestamps
    // solhint-disable-next-line not-rely-on-time
    _userTodos[msg.sender][index].updatedAt = block.timestamp;
    if (_userTodos[msg.sender][index].completed) {
      // solhint-disable-next-line not-rely-on-time
      _userTodos[msg.sender][index].completedAt = block.timestamp;
    } else {
      _userTodos[msg.sender][index].completedAt = 0;
    }

    // Emit event
    emit TodoCompletionToggled(msg.sender, id, _userTodos[msg.sender][index].completed);
  }

  /**
   * @dev Delete a todo
   * @param id The ID of the todo to delete
   */
  function deleteTodo(uint256 id) external {
    // Get todo index
    uint256 index = _getTodoIndex(msg.sender, id);

    // Get the last todo in the array
    uint256 lastIndex = _userTodos[msg.sender].length - 1;

    if (index != lastIndex) {
      // Move the last todo to the deleted position
      Todo memory lastTodo = _userTodos[msg.sender][lastIndex];
      _userTodos[msg.sender][index] = lastTodo;

      // Update the index mapping for the moved todo
      _todoIndexes[msg.sender][lastTodo.id] = index;
    }

    // Remove the last todo
    _userTodos[msg.sender].pop();

    // Delete the index mapping
    delete _todoIndexes[msg.sender][id];

    // Emit event
    emit TodoDeleted(msg.sender, id);
  }

  /**
   * @dev Get all todos for the caller
   * @return Array of todos
   */
  function getTodos() external view returns (Todo[] memory) {
    return _userTodos[msg.sender];
  }

  /**
   * @dev Get a specific todo by ID
   * @param id The ID of the todo to get
   * @return The todo
   */
  function getTodo(uint256 id) external view returns (Todo memory) {
    uint256 index = _getTodoIndex(msg.sender, id);
    return _userTodos[msg.sender][index];
  }

  /**
   * @dev Get todo statistics for the caller
   * @return Statistics about the todos
   */
  function getTodoStats() external view returns (TodoStats memory) {
    Todo[] memory todos = _userTodos[msg.sender];
    uint256 total = todos.length;
    uint256 completed = 0;
    uint256 highPriority = 0;

    for (uint256 i = 0; i < total; i++) {
      if (todos[i].completed) {
        completed++;
      }

      if (todos[i].priority == Priority.High && !todos[i].completed) {
        highPriority++;
      }
    }

    return TodoStats({total: total, completed: completed, pending: total - completed, highPriority: highPriority});
  }

  /**
   * @dev Get the index of a todo in the array
   * @param user The address of the user
   * @param id The ID of the todo
   * @return The index of the todo
   */
  function _getTodoIndex(address user, uint256 id) internal view returns (uint256) {
    if (!_todoExists(user, id)) revert TodoNotFound();
    return _todoIndexes[user][id];
  }

  /**
   * @dev Check if a todo exists
   * @param user The address of the user
   * @param id The ID of the todo
   * @return Whether the todo exists
   */
  function _todoExists(address user, uint256 id) internal view returns (bool) {
    if (_userTodos[user].length == 0) {
      return false;
    }

    uint256 index = _todoIndexes[user][id];
    return index < _userTodos[user].length && _userTodos[user][index].id == id;
  }
}
