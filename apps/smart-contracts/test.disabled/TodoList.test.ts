import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TodoList } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('TodoList', function () {
  let todoList: TodoList;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the contract
    const TodoListFactory = await ethers.getContractFactory('TodoList');
    todoList = await TodoListFactory.deploy();
  });

  describe('Todo Creation', function () {
    it('should create a new todo', async function () {
      const title = 'Test Todo';
      const description = 'This is a test todo';

      // Create a todo
      const tx = await todoList.createTodo(title, description);
      const receipt = await tx.wait();

      // Check event
      const event = receipt?.logs[0];
      expect(event).to.not.be.undefined;

      // Get the todo
      const todo = await todoList.getTodo(0);

      // Verify todo properties
      expect(todo.id).to.equal(0);
      expect(todo.title).to.equal(title);
      expect(todo.description).to.equal(description);
      expect(todo.completed).to.be.false;
      expect(todo.createdAt).to.not.equal(0);
      expect(todo.updatedAt).to.not.equal(0);
    });

    it('should not create a todo with empty title', async function () {
      // Try to create a todo with empty title
      await expect(todoList.createTodo('', 'Description')).to.be.revertedWith('Title cannot be empty');
    });

    it('should allow different users to create todos', async function () {
      // User 1 creates a todo
      await todoList.connect(user1).createTodo('User 1 Todo', 'User 1 Description');

      // User 2 creates a todo
      await todoList.connect(user2).createTodo('User 2 Todo', 'User 2 Description');

      // Get user 1's todo
      const user1Todo = await todoList.connect(user1).getTodo(0);
      expect(user1Todo.title).to.equal('User 1 Todo');

      // Get user 2's todo
      const user2Todo = await todoList.connect(user2).getTodo(0);
      expect(user2Todo.title).to.equal('User 2 Todo');
    });
  });

  describe('Todo Retrieval', function () {
    beforeEach(async function () {
      // Create some todos for testing
      await todoList.createTodo('Todo 1', 'Description 1');
      await todoList.createTodo('Todo 2', 'Description 2');
    });

    it('should get a todo by id', async function () {
      const todo = await todoList.getTodo(1);
      expect(todo.id).to.equal(1);
      expect(todo.title).to.equal('Todo 2');
      expect(todo.description).to.equal('Description 2');
    });

    it('should fail when getting a non-existent todo', async function () {
      await expect(todoList.getTodo(99)).to.be.revertedWith('Todo does not exist');
    });

    it('should get all todos for a user', async function () {
      const todos = await todoList.getAllTodos();
      expect(todos.length).to.equal(2);
      expect(todos[0].title).to.equal('Todo 1');
      expect(todos[1].title).to.equal('Todo 2');
    });

    it('should return an empty array when user has no todos', async function () {
      const todos = await todoList.connect(user1).getAllTodos();
      expect(todos.length).to.equal(0);
    });
  });

  describe('Todo Updates', function () {
    beforeEach(async function () {
      // Create a todo for testing
      await todoList.createTodo('Original Todo', 'Original Description');
    });

    it('should update a todo', async function () {
      // Update the todo
      await todoList.updateTodo(0, 'Updated Todo', 'Updated Description', true);

      // Get the updated todo
      const todo = await todoList.getTodo(0);

      // Verify todo properties
      expect(todo.title).to.equal('Updated Todo');
      expect(todo.description).to.equal('Updated Description');
      expect(todo.completed).to.be.true;
    });

    it('should not update a todo with empty title', async function () {
      await expect(todoList.updateTodo(0, '', 'Updated Description', true)).to.be.revertedWith('Title cannot be empty');
    });

    it('should toggle the completed status', async function () {
      // Initially, the todo is not completed
      let todo = await todoList.getTodo(0);
      expect(todo.completed).to.be.false;

      // Toggle completed status
      await todoList.toggleCompleted(0);

      // Now the todo should be completed
      todo = await todoList.getTodo(0);
      expect(todo.completed).to.be.true;

      // Toggle again
      await todoList.toggleCompleted(0);

      // Now the todo should be not completed again
      todo = await todoList.getTodo(0);
      expect(todo.completed).to.be.false;
    });
  });

  describe('Todo Deletion', function () {
    beforeEach(async function () {
      // Create some todos for testing
      await todoList.createTodo('Todo 1', 'Description 1');
      await todoList.createTodo('Todo 2', 'Description 2');
      await todoList.createTodo('Todo 3', 'Description 3');
    });

    it('should delete a todo', async function () {
      // Delete the second todo
      await todoList.deleteTodo(1);

      // Get all todos
      const todos = await todoList.getAllTodos();

      // Should have 2 todos left
      expect(todos.length).to.equal(2);

      // The remaining todos should be Todo 1 and Todo 3
      expect(todos[0].title).to.equal('Todo 1');
      expect(todos[1].title).to.equal('Todo 3');
    });

    it('should fail when deleting a non-existent todo', async function () {
      await expect(todoList.deleteTodo(99)).to.be.revertedWith('Todo does not exist');
    });

    it('should allow deleting all todos', async function () {
      // Delete all todos
      await todoList.deleteTodo(0);
      await todoList.deleteTodo(1);
      await todoList.deleteTodo(2);

      // Get all todos
      const todos = await todoList.getAllTodos();

      // Should have no todos left
      expect(todos.length).to.equal(0);
    });
  });
});
