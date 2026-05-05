const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('TodoList Contract - Simple Tests', function () {
  let TodoList;
  let todoList;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    TodoList = await ethers.getContractFactory('TodoList');
    todoList = await TodoList.deploy();
    await todoList.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      expect(await todoList.getAddress()).to.be.properAddress;
    });

    it('Should set the right owner', async function () {
      expect(await todoList.owner()).to.equal(owner.address);
    });
  });

  describe('Todo Creation', function () {
    it('Should create a todo successfully', async function () {
      const title = 'Test Todo';
      const description = 'Test Description';
      const priority = 1; // Medium

      await expect(todoList.createTodo(title, description, priority))
        .to.emit(todoList, 'TodoCreated')
        .withArgs(owner.address, 1, title, priority);
    });

    it('Should fail with empty title', async function () {
      await expect(todoList.createTodo('', 'Description', 1)).to.be.revertedWithCustomError(todoList, 'TitleEmpty');
    });

    it('Should fail with title too long', async function () {
      const longTitle = 'a'.repeat(101); // Exceeds MAX_TITLE_LENGTH
      await expect(todoList.createTodo(longTitle, 'Description', 1)).to.be.revertedWithCustomError(
        todoList,
        'TitleTooLong',
      );
    });

    it('Should fail with description too long', async function () {
      const longDescription = 'a'.repeat(501); // Exceeds MAX_DESCRIPTION_LENGTH
      await expect(todoList.createTodo('Title', longDescription, 1)).to.be.revertedWithCustomError(
        todoList,
        'DescriptionTooLong',
      );
    });
  });

  describe('Todo Retrieval', function () {
    beforeEach(async function () {
      await todoList.createTodo('Todo 1', 'Description 1', 0);
      await todoList.createTodo('Todo 2', 'Description 2', 1);
    });

    it('Should get todos for user', async function () {
      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(2);
      expect(todos[0].title).to.equal('Todo 1');
      expect(todos[1].title).to.equal('Todo 2');
    });

    it('Should get specific todo by ID', async function () {
      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal('Todo 1');
      expect(todo.description).to.equal('Description 1');
      expect(todo.priority).to.equal(0);
      expect(todo.completed).to.be.false;
    });

    it('Should get todo statistics', async function () {
      const stats = await todoList.getTodoStats();
      expect(stats.total).to.equal(2);
      expect(stats.completed).to.equal(0);
      expect(stats.pending).to.equal(2);
      expect(stats.highPriority).to.equal(0);
    });
  });

  describe('Todo Updates', function () {
    beforeEach(async function () {
      await todoList.createTodo('Original Title', 'Original Description', 1);
    });

    it('Should update todo successfully', async function () {
      const newTitle = 'Updated Title';
      const newDescription = 'Updated Description';
      const newPriority = 2;

      await expect(todoList.updateTodo(1, newTitle, newDescription, newPriority))
        .to.emit(todoList, 'TodoUpdated')
        .withArgs(owner.address, 1, newTitle, newPriority);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal(newTitle);
      expect(todo.description).to.equal(newDescription);
      expect(todo.priority).to.equal(newPriority);
    });

    it('Should toggle todo completion', async function () {
      await expect(todoList.toggleTodoCompletion(1))
        .to.emit(todoList, 'TodoCompletionToggled')
        .withArgs(owner.address, 1, true);

      const todo = await todoList.getTodo(1);
      expect(todo.completed).to.be.true;
    });
  });

  describe('Todo Deletion', function () {
    beforeEach(async function () {
      await todoList.createTodo('Todo 1', 'Description 1', 1);
      await todoList.createTodo('Todo 2', 'Description 2', 1);
    });

    it('Should delete todo successfully', async function () {
      await expect(todoList.deleteTodo(1)).to.emit(todoList, 'TodoDeleted').withArgs(owner.address, 1);

      // Should fail to get deleted todo
      await expect(todoList.getTodo(1)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');
    });
  });
});
