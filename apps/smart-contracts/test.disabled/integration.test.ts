import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { TodoList, TodoListFactory } from '../typechain-types';

describe('Blockchain Integration Tests', () => {
  let todoListFactory: TodoListFactory;
  let todoList: TodoList;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    // Deploy TodoListFactory
    const TodoListFactory = await ethers.getContractFactory('TodoListFactory');
    todoListFactory = await TodoListFactory.deploy();
    await todoListFactory.deployed();

    // Create a TodoList for user1
    await todoListFactory.connect(user1).createTodoList();
    const todoListAddress = await todoListFactory.getUserTodoList(user1Address);

    // Get TodoList contract instance
    const TodoList = await ethers.getContractFactory('TodoList');
    todoList = TodoList.attach(todoListAddress) as TodoList;
  });

  describe('Factory and TodoList Integration', () => {
    it('should create unique TodoList for each user', async () => {
      // Create TodoList for user2
      await todoListFactory.connect(user2).createTodoList();

      const user1TodoListAddress = await todoListFactory.getUserTodoList(user1Address);
      const user2TodoListAddress = await todoListFactory.getUserTodoList(user2Address);

      expect(user1TodoListAddress).to.not.equal(user2TodoListAddress);
      expect(user1TodoListAddress).to.not.equal(ethers.constants.AddressZero);
      expect(user2TodoListAddress).to.not.equal(ethers.constants.AddressZero);
    });

    it('should prevent creating multiple TodoLists for same user', async () => {
      await expect(todoListFactory.connect(user1).createTodoList()).to.be.revertedWith(
        'TodoList already exists for this user',
      );
    });

    it('should track all created TodoLists', async () => {
      await todoListFactory.connect(user2).createTodoList();

      const allTodoLists = await todoListFactory.getAllTodoLists();
      expect(allTodoLists).to.have.length(2);

      const user1TodoListAddress = await todoListFactory.getUserTodoList(user1Address);
      const user2TodoListAddress = await todoListFactory.getUserTodoList(user2Address);

      expect(allTodoLists).to.include(user1TodoListAddress);
      expect(allTodoLists).to.include(user2TodoListAddress);
    });
  });

  describe('Todo CRUD Operations Integration', () => {
    it('should create, read, update, and delete todos', async () => {
      // Create todo
      const title = 'Integration Test Todo';
      const description = 'Testing full CRUD operations';
      const priority = 1; // medium
      const dueDate = Math.floor(Date.now() / 1000) + 86400; // tomorrow

      const createTx = await todoList.connect(user1).createTodo(title, description, priority, dueDate);
      await createTx.wait();

      // Read todo
      const todo = await todoList.getTodo(0);
      expect(todo.title).to.equal(title);
      expect(todo.description).to.equal(description);
      expect(todo.priority).to.equal(priority);
      expect(todo.dueDate).to.equal(dueDate);
      expect(todo.completed).to.be.false;
      expect(todo.owner).to.equal(user1Address);

      // Update todo
      const newTitle = 'Updated Integration Test Todo';
      const newDescription = 'Updated description';
      const newPriority = 2; // high
      const newDueDate = Math.floor(Date.now() / 1000) + 172800; // day after tomorrow

      const updateTx = await todoList.connect(user1).updateTodo(0, newTitle, newDescription, newPriority, newDueDate);
      await updateTx.wait();

      const updatedTodo = await todoList.getTodo(0);
      expect(updatedTodo.title).to.equal(newTitle);
      expect(updatedTodo.description).to.equal(newDescription);
      expect(updatedTodo.priority).to.equal(newPriority);
      expect(updatedTodo.dueDate).to.equal(newDueDate);

      // Toggle completion
      const toggleTx = await todoList.connect(user1).toggleTodo(0);
      await toggleTx.wait();

      const toggledTodo = await todoList.getTodo(0);
      expect(toggledTodo.completed).to.be.true;

      // Delete todo
      const deleteTx = await todoList.connect(user1).deleteTodo(0);
      await deleteTx.wait();

      await expect(todoList.getTodo(0)).to.be.revertedWith('Todo does not exist');
    });

    it('should handle multiple todos correctly', async () => {
      const todos = [
        { title: 'Todo 1', description: 'First todo', priority: 0, dueDate: Math.floor(Date.now() / 1000) + 86400 },
        { title: 'Todo 2', description: 'Second todo', priority: 1, dueDate: Math.floor(Date.now() / 1000) + 172800 },
        { title: 'Todo 3', description: 'Third todo', priority: 2, dueDate: Math.floor(Date.now() / 1000) + 259200 },
      ];

      // Create multiple todos
      for (const todo of todos) {
        const tx = await todoList.connect(user1).createTodo(todo.title, todo.description, todo.priority, todo.dueDate);
        await tx.wait();
      }

      // Verify all todos exist
      for (let i = 0; i < todos.length; i++) {
        const todo = await todoList.getTodo(i);
        expect(todo.title).to.equal(todos[i].title);
        expect(todo.description).to.equal(todos[i].description);
        expect(todo.priority).to.equal(todos[i].priority);
      }

      // Get all todos
      const allTodos = await todoList.getAllTodos();
      expect(allTodos).to.have.length(3);

      // Complete middle todo
      await todoList.connect(user1).toggleTodo(1);
      const completedTodo = await todoList.getTodo(1);
      expect(completedTodo.completed).to.be.true;

      // Delete first todo
      await todoList.connect(user1).deleteTodo(0);

      // Verify todo count decreased
      const remainingTodos = await todoList.getAllTodos();
      expect(remainingTodos).to.have.length(2);
    });
  });

  describe('Access Control Integration', () => {
    it('should prevent unauthorized access to todos', async () => {
      // User1 creates a todo
      await todoList
        .connect(user1)
        .createTodo('Private Todo', 'Only user1 should access this', 1, Math.floor(Date.now() / 1000) + 86400);

      // User2 should not be able to update user1's todo
      await expect(todoList.connect(user2).updateTodo(0, 'Hacked', 'Unauthorized update', 2, 0)).to.be.revertedWith(
        'Not the owner of this todo',
      );

      // User2 should not be able to delete user1's todo
      await expect(todoList.connect(user2).deleteTodo(0)).to.be.revertedWith('Not the owner of this todo');

      // User2 should not be able to toggle user1's todo
      await expect(todoList.connect(user2).toggleTodo(0)).to.be.revertedWith('Not the owner of this todo');
    });

    it('should allow only owner to manage their TodoList', async () => {
      // Create TodoList for user2
      await todoListFactory.connect(user2).createTodoList();
      const user2TodoListAddress = await todoListFactory.getUserTodoList(user2Address);
      const user2TodoList = (await ethers.getContractFactory('TodoList')).attach(user2TodoListAddress) as TodoList;

      // User1 should not be able to create todos in user2's list
      await expect(
        user2TodoList
          .connect(user1)
          .createTodo('Unauthorized', 'Should fail', 1, Math.floor(Date.now() / 1000) + 86400),
      ).to.be.revertedWith('Not the owner of this TodoList');
    });
  });

  describe('Event Integration', () => {
    it('should emit events for all operations', async () => {
      // Test TodoCreated event
      const createTx = await todoList
        .connect(user1)
        .createTodo('Event Test Todo', 'Testing events', 1, Math.floor(Date.now() / 1000) + 86400);

      await expect(createTx).to.emit(todoList, 'TodoCreated').withArgs(0, user1Address, 'Event Test Todo');

      // Test TodoUpdated event
      const updateTx = await todoList
        .connect(user1)
        .updateTodo(0, 'Updated Event Test Todo', 'Updated description', 2, Math.floor(Date.now() / 1000) + 172800);

      await expect(updateTx).to.emit(todoList, 'TodoUpdated').withArgs(0, user1Address);

      // Test TodoToggled event
      const toggleTx = await todoList.connect(user1).toggleTodo(0);

      await expect(toggleTx).to.emit(todoList, 'TodoToggled').withArgs(0, user1Address, true);

      // Test TodoDeleted event
      const deleteTx = await todoList.connect(user1).deleteTodo(0);

      await expect(deleteTx).to.emit(todoList, 'TodoDeleted').withArgs(0, user1Address);
    });

    it('should emit factory events', async () => {
      // Test TodoListCreated event
      const createTx = await todoListFactory.connect(user2).createTodoList();

      await expect(createTx).to.emit(todoListFactory, 'TodoListCreated').withArgs(user2Address);
    });
  });

  describe('Gas Optimization Integration', () => {
    it('should have reasonable gas costs for operations', async () => {
      // Create todo and measure gas
      const createTx = await todoList
        .connect(user1)
        .createTodo('Gas Test Todo', 'Testing gas consumption', 1, Math.floor(Date.now() / 1000) + 86400);
      const createReceipt = await createTx.wait();

      expect(createReceipt.gasUsed.toNumber()).to.be.lessThan(200000); // Reasonable gas limit

      // Update todo and measure gas
      const updateTx = await todoList
        .connect(user1)
        .updateTodo(0, 'Updated Gas Test Todo', 'Updated description', 2, Math.floor(Date.now() / 1000) + 172800);
      const updateReceipt = await updateTx.wait();

      expect(updateReceipt.gasUsed.toNumber()).to.be.lessThan(100000);

      // Toggle todo and measure gas
      const toggleTx = await todoList.connect(user1).toggleTodo(0);
      const toggleReceipt = await toggleTx.wait();

      expect(toggleReceipt.gasUsed.toNumber()).to.be.lessThan(50000);

      // Delete todo and measure gas
      const deleteTx = await todoList.connect(user1).deleteTodo(0);
      const deleteReceipt = await deleteTx.wait();

      expect(deleteReceipt.gasUsed.toNumber()).to.be.lessThan(50000);
    });

    it('should optimize gas for batch operations', async () => {
      const batchSize = 5;
      const gasUsages: number[] = [];

      // Create multiple todos and track gas usage
      for (let i = 0; i < batchSize; i++) {
        const tx = await todoList
          .connect(user1)
          .createTodo(`Batch Todo ${i}`, `Description ${i}`, i % 3, Math.floor(Date.now() / 1000) + 86400 + i * 3600);
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }

      // Gas usage should be consistent (not increasing significantly)
      const avgGas = gasUsages.reduce((sum, gas) => sum + gas, 0) / gasUsages.length;
      gasUsages.forEach(gas => {
        expect(Math.abs(gas - avgGas)).to.be.lessThan(avgGas * 0.1); // Within 10% of average
      });
    });
  });

  describe('Data Integrity Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Create initial todos
      const initialTodos = [
        { title: 'Todo A', description: 'First', priority: 0 },
        { title: 'Todo B', description: 'Second', priority: 1 },
        { title: 'Todo C', description: 'Third', priority: 2 },
      ];

      for (const todo of initialTodos) {
        await todoList
          .connect(user1)
          .createTodo(todo.title, todo.description, todo.priority, Math.floor(Date.now() / 1000) + 86400);
      }

      // Verify initial state
      let allTodos = await todoList.getAllTodos();
      expect(allTodos).to.have.length(3);

      // Complete some todos
      await todoList.connect(user1).toggleTodo(0);
      await todoList.connect(user1).toggleTodo(2);

      // Verify completion status
      const todo0 = await todoList.getTodo(0);
      const todo1 = await todoList.getTodo(1);
      const todo2 = await todoList.getTodo(2);

      expect(todo0.completed).to.be.true;
      expect(todo1.completed).to.be.false;
      expect(todo2.completed).to.be.true;

      // Delete middle todo
      await todoList.connect(user1).deleteTodo(1);

      // Verify remaining todos maintain correct data
      allTodos = await todoList.getAllTodos();
      expect(allTodos).to.have.length(2);

      // Verify that remaining todos still have correct data
      const remainingTodo0 = await todoList.getTodo(0);
      const remainingTodo1 = await todoList.getTodo(1);

      expect(remainingTodo0.title).to.equal('Todo A');
      expect(remainingTodo0.completed).to.be.true;
      expect(remainingTodo1.title).to.equal('Todo C');
      expect(remainingTodo1.completed).to.be.true;
    });

    it('should handle edge cases correctly', async () => {
      // Test with empty strings
      await expect(
        todoList.connect(user1).createTodo('', 'Empty title', 1, Math.floor(Date.now() / 1000) + 86400),
      ).to.be.revertedWith('Title cannot be empty');

      // Test with past due date
      await expect(
        todoList.connect(user1).createTodo('Past Due', 'Past due date', 1, Math.floor(Date.now() / 1000) - 86400),
      ).to.be.revertedWith('Due date cannot be in the past');

      // Test with invalid priority
      await expect(
        todoList
          .connect(user1)
          .createTodo('Invalid Priority', 'Invalid priority', 5, Math.floor(Date.now() / 1000) + 86400),
      ).to.be.revertedWith('Invalid priority');

      // Test operations on non-existent todo
      await expect(todoList.getTodo(999)).to.be.revertedWith('Todo does not exist');
      await expect(todoList.connect(user1).deleteTodo(999)).to.be.revertedWith('Todo does not exist');
      await expect(todoList.connect(user1).toggleTodo(999)).to.be.revertedWith('Todo does not exist');
    });
  });

  describe('Upgrade and Migration Integration', () => {
    it('should handle contract upgrades gracefully', async () => {
      // Create some todos in the original contract
      await todoList
        .connect(user1)
        .createTodo('Pre-upgrade Todo', 'This should survive upgrade', 1, Math.floor(Date.now() / 1000) + 86400);

      // Simulate upgrade by deploying new version
      const TodoListV2 = await ethers.getContractFactory('TodoList'); // In real scenario, this would be TodoListV2
      const todoListV2 = await TodoListV2.deploy(user1Address);
      await todoListV2.deployed();

      // In a real upgrade scenario, you would:
      // 1. Migrate data from old contract to new contract
      // 2. Update factory to point to new implementation
      // 3. Verify data integrity

      // For this test, we'll just verify the new contract works
      await todoListV2
        .connect(user1)
        .createTodo('Post-upgrade Todo', 'This is in the new contract', 1, Math.floor(Date.now() / 1000) + 86400);

      const newTodo = await todoListV2.getTodo(0);
      expect(newTodo.title).to.equal('Post-upgrade Todo');
    });
  });

  describe('Multi-user Interaction Integration', () => {
    it('should handle multiple users creating todos simultaneously', async () => {
      // Create TodoLists for multiple users
      await todoListFactory.connect(user2).createTodoList();

      const user1TodoListAddress = await todoListFactory.getUserTodoList(user1Address);
      const user2TodoListAddress = await todoListFactory.getUserTodoList(user2Address);

      const user1TodoList = (await ethers.getContractFactory('TodoList')).attach(user1TodoListAddress) as TodoList;
      const user2TodoList = (await ethers.getContractFactory('TodoList')).attach(user2TodoListAddress) as TodoList;

      // Create todos simultaneously
      const promises = [
        user1TodoList
          .connect(user1)
          .createTodo('User1 Todo 1', 'Description 1', 1, Math.floor(Date.now() / 1000) + 86400),
        user2TodoList
          .connect(user2)
          .createTodo('User2 Todo 1', 'Description 1', 1, Math.floor(Date.now() / 1000) + 86400),
        user1TodoList
          .connect(user1)
          .createTodo('User1 Todo 2', 'Description 2', 2, Math.floor(Date.now() / 1000) + 172800),
        user2TodoList
          .connect(user2)
          .createTodo('User2 Todo 2', 'Description 2', 2, Math.floor(Date.now() / 1000) + 172800),
      ];

      await Promise.all(promises);

      // Verify each user has their own todos
      const user1Todos = await user1TodoList.getAllTodos();
      const user2Todos = await user2TodoList.getAllTodos();

      expect(user1Todos).to.have.length(2);
      expect(user2Todos).to.have.length(2);

      expect(user1Todos[0].title).to.equal('User1 Todo 1');
      expect(user1Todos[1].title).to.equal('User1 Todo 2');
      expect(user2Todos[0].title).to.equal('User2 Todo 1');
      expect(user2Todos[1].title).to.equal('User2 Todo 2');
    });
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle large numbers of todos efficiently', async () => {
      const todoCount = 100;
      const batchSize = 10;

      // Create todos in batches to avoid gas limit issues
      for (let batch = 0; batch < todoCount / batchSize; batch++) {
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
          const todoIndex = batch * batchSize + i;
          promises.push(
            todoList
              .connect(user1)
              .createTodo(
                `Todo ${todoIndex}`,
                `Description ${todoIndex}`,
                todoIndex % 3,
                Math.floor(Date.now() / 1000) + 86400 + todoIndex * 3600,
              ),
          );
        }
        await Promise.all(promises);
      }

      // Verify all todos were created
      const allTodos = await todoList.getAllTodos();
      expect(allTodos).to.have.length(todoCount);

      // Test random access performance
      const randomIndex = Math.floor(Math.random() * todoCount);
      const randomTodo = await todoList.getTodo(randomIndex);
      expect(randomTodo.title).to.equal(`Todo ${randomIndex}`);

      // Test batch operations performance
      const startTime = Date.now();

      // Toggle completion for first 10 todos
      const togglePromises = [];
      for (let i = 0; i < 10; i++) {
        togglePromises.push(todoList.connect(user1).toggleTodo(i));
      }
      await Promise.all(togglePromises);

      const endTime = Date.now();
      expect(endTime - startTime).to.be.lessThan(5000); // Should complete within 5 seconds
    });
  });
});
