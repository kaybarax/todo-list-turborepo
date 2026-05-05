const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Base Smart Contracts Integration Tests', function () {
  let TodoList;
  let TodoListFactory;
  let todoListFactory;
  let owner;
  let user1;
  let user2;
  let user3;
  let addrs;

  beforeEach(async function () {
    [owner, user1, user2, user3, ...addrs] = await ethers.getSigners();

    // Deploy contracts
    TodoList = await ethers.getContractFactory('TodoList');
    TodoListFactory = await ethers.getContractFactory('TodoListFactory');

    todoListFactory = await TodoListFactory.deploy();
    await todoListFactory.waitForDeployment();
  });

  describe('Contract Deployment and Interaction', function () {
    it('Should deploy contracts successfully on Base network', async function () {
      // Verify factory deployment
      expect(await todoListFactory.getAddress()).to.be.properAddress;
      expect(await todoListFactory.owner()).to.equal(owner.address);

      // Create TodoList via factory
      await todoListFactory.connect(user1).createTodoList();

      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      expect(todoListAddress).to.not.equal(ethers.ZeroAddress);

      // Verify TodoList deployment
      const todoListContract = TodoList.attach(todoListAddress);
      expect(await todoListContract.owner()).to.equal(user1.address);
    });

    it('Should handle complete todo lifecycle through factory', async function () {
      // Create TodoList via factory
      await todoListFactory.connect(user1).createTodoList();
      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoList = TodoList.attach(todoListAddress);

      // Create todo
      await expect(todoList.connect(user1).createTodo('Integration Todo', 'Testing integration', 1))
        .to.emit(todoList, 'TodoCreated')
        .withArgs(user1.address, 1, 'Integration Todo', 1);

      // Update todo
      await expect(todoList.connect(user1).updateTodo(1, 'Updated Todo', 'Updated description', 2))
        .to.emit(todoList, 'TodoUpdated')
        .withArgs(user1.address, 1, 'Updated Todo', 2);

      // Toggle completion
      await expect(todoList.connect(user1).toggleTodoCompletion(1))
        .to.emit(todoList, 'TodoCompletionToggled')
        .withArgs(user1.address, 1, true);

      // Verify final state
      const todo = await todoList.connect(user1).getTodo(1);
      expect(todo.title).to.equal('Updated Todo');
      expect(todo.description).to.equal('Updated description');
      expect(todo.priority).to.equal(2);
      expect(todo.completed).to.be.true;
      expect(todo.completedAt).to.be.above(0);
    });

    it('Should support multiple users with independent TodoLists', async function () {
      // Create TodoLists for multiple users
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();
      await todoListFactory.connect(user3).createTodoList();

      // Get TodoList contracts
      const user1TodoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoListAddress = await todoListFactory.getTodoListForUser(user2.address);
      const user3TodoListAddress = await todoListFactory.getTodoListForUser(user3.address);

      const user1TodoList = TodoList.attach(user1TodoListAddress);
      const user2TodoList = TodoList.attach(user2TodoListAddress);
      const user3TodoList = TodoList.attach(user3TodoListAddress);

      // Create different todos for each user
      await user1TodoList.connect(user1).createTodo('User1 Task 1', 'High priority task', 2);
      await user1TodoList.connect(user1).createTodo('User1 Task 2', 'Medium priority task', 1);

      await user2TodoList.connect(user2).createTodo('User2 Task 1', 'Low priority task', 0);
      await user2TodoList.connect(user2).createTodo('User2 Task 2', 'High priority task', 2);
      await user2TodoList.connect(user2).createTodo('User2 Task 3', 'Medium priority task', 1);

      await user3TodoList.connect(user3).createTodo('User3 Task 1', 'Single task', 1);

      // Complete some todos
      await user1TodoList.connect(user1).toggleTodoCompletion(1);
      await user2TodoList.connect(user2).toggleTodoCompletion(2);

      // Verify independent state
      const user1Todos = await user1TodoList.connect(user1).getTodos();
      const user2Todos = await user2TodoList.connect(user2).getTodos();
      const user3Todos = await user3TodoList.connect(user3).getTodos();

      expect(user1Todos.length).to.equal(2);
      expect(user2Todos.length).to.equal(3);
      expect(user3Todos.length).to.equal(1);

      // Verify statistics
      const user1Stats = await user1TodoList.connect(user1).getTodoStats();
      const user2Stats = await user2TodoList.connect(user2).getTodoStats();
      const user3Stats = await user3TodoList.connect(user3).getTodoStats();

      expect(user1Stats.total).to.equal(2);
      expect(user1Stats.completed).to.equal(1);
      expect(user1Stats.highPriority).to.equal(0); // Zero uncompleted high priority

      expect(user2Stats.total).to.equal(3);
      expect(user2Stats.completed).to.equal(1);
      expect(user2Stats.highPriority).to.equal(0); // Zero uncompleted high priority

      expect(user3Stats.total).to.equal(1);
      expect(user3Stats.completed).to.equal(0);
      expect(user3Stats.highPriority).to.equal(0);
    });

    it('Should handle cross-contract interactions correctly', async function () {
      // Create TodoLists for multiple users
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();

      // Verify factory state
      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(2);

      const users = await todoListFactory.getUsers(0, 10);
      expect(users.length).to.equal(2);
      expect(users).to.include(user1.address);
      expect(users).to.include(user2.address);

      // Get TodoList contracts and add todos
      const user1TodoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoListAddress = await todoListFactory.getTodoListForUser(user2.address);

      const user1TodoList = TodoList.attach(user1TodoListAddress);
      const user2TodoList = TodoList.attach(user2TodoListAddress);

      // Add todos and verify they don't interfere with each other
      await user1TodoList.connect(user1).createTodo('User1 Todo', 'Description', 1);
      await user2TodoList.connect(user2).createTodo('User2 Todo', 'Description', 2);

      // Verify isolation
      const user1Todos = await user1TodoList.connect(user1).getTodos();
      const user2Todos = await user2TodoList.connect(user2).getTodos();

      expect(user1Todos.length).to.equal(1);
      expect(user2Todos.length).to.equal(1);
      expect(user1Todos[0].title).to.equal('User1 Todo');
      expect(user2Todos[0].title).to.equal('User2 Todo');

      // Verify users cannot access each other's todos
      await expect(user1TodoList.connect(user2).getTodo(1)).to.be.revertedWithCustomError(
        user1TodoList,
        'TodoNotFound',
      );
      await expect(user2TodoList.connect(user1).getTodo(1)).to.be.revertedWithCustomError(
        user2TodoList,
        'TodoNotFound',
      );
    });
  });

  describe('Base L2 Network Specific Integration', function () {
    it('Should work efficiently on Base L2 network', async function () {
      // Test that operations are efficient on Base L2
      const startTime = Date.now();

      // Create factory and TodoLists
      await todoListFactory.connect(user1).createTodoList();
      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoList = TodoList.attach(todoListAddress);

      // Perform multiple operations
      await todoList.connect(user1).createTodo('Base L2 Todo 1', 'Testing Base efficiency', 1);
      await todoList.connect(user1).createTodo('Base L2 Todo 2', 'Testing Base efficiency', 2);
      await todoList.connect(user1).createTodo('Base L2 Todo 3', 'Testing Base efficiency', 0);

      await todoList.connect(user1).toggleTodoCompletion(1);
      await todoList.connect(user1).updateTodo(2, 'Updated on Base', 'Updated description', 1);

      const endTime = Date.now();

      // Operations should complete quickly on Base L2
      expect(endTime - startTime).to.be.lessThan(10000); // 10 seconds

      // Verify final state
      const todos = await todoList.connect(user1).getTodos();
      expect(todos.length).to.equal(3);
      expect(todos[0].completed).to.be.true;
      expect(todos[1].title).to.equal('Updated on Base');
    });

    it('Should handle gas optimization on Base L2', async function () {
      // Create TodoList
      const createTx = await todoListFactory.connect(user1).createTodoList();
      const createReceipt = await createTx.wait();

      // Base L2 should have efficient contract creation
      expect(createReceipt.gasUsed).to.be.lessThan(2000000n);

      // Get TodoList and test operations
      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoList = TodoList.attach(todoListAddress);

      // Test todo operations gas usage
      const todoTx = await todoList.connect(user1).createTodo('Gas Test', 'Testing gas usage', 1);
      const todoReceipt = await todoTx.wait();
      expect(todoReceipt.gasUsed).to.be.lessThan(300000n);

      // Toggle todo
      const toggleTx = await todoList.connect(user1).toggleTodoCompletion(1);
      const toggleReceipt = await toggleTx.wait();
      expect(toggleReceipt.gasUsed).to.be.lessThan(100000n);

      // Delete todo
      const deleteTx = await todoList.connect(user1).deleteTodo(1);
      const deleteReceipt = await deleteTx.wait();
      expect(deleteReceipt.gasUsed).to.be.lessThan(100000n);
    });

    it('Should support Base network features', async function () {
      // Verify we're on the correct network (Base or hardhat)
      const network = await ethers.provider.getNetwork();
      expect([8453n, 31337n, 1281n, 1284n]).to.include(network.chainId); // Base mainnet, hardhat, or moonbeam

      // Test that contracts work with Base's EVM implementation
      await todoListFactory.connect(user1).createTodoList();
      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoList = TodoList.attach(todoListAddress);

      // Test Base-specific optimizations (low gas costs)
      const tx = await todoList.connect(user1).createTodo('Base Network Test', 'Testing Base features', 2);
      const receipt = await tx.wait();

      // Base should have very low gas costs
      expect(receipt.gasUsed).to.be.lessThan(300000n);

      // Verify functionality
      const todo = await todoList.connect(user1).getTodo(1);
      expect(todo.title).to.equal('Base Network Test');
      expect(todo.priority).to.equal(2);
    });
  });

  describe('Error Handling and Edge Cases', function () {
    it('Should handle factory and TodoList errors consistently', async function () {
      // Test factory errors
      await expect(todoListFactory.connect(user1).createTodoList()).to.emit(todoListFactory, 'TodoListCreated');

      await expect(todoListFactory.connect(user1).createTodoList()).to.be.revertedWithCustomError(
        todoListFactory,
        'TodoListAlreadyExists',
      );

      // Test TodoList errors
      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoList = TodoList.attach(todoListAddress);

      await expect(todoList.connect(user1).getTodo(999)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');

      await expect(todoList.connect(user1).createTodo('', 'Description', 1)).to.be.revertedWithCustomError(
        todoList,
        'TitleEmpty',
      );
    });

    it('Should handle concurrent operations across multiple contracts', async function () {
      // Create multiple TodoLists concurrently
      const createPromises = [
        todoListFactory.connect(user1).createTodoList(),
        todoListFactory.connect(user2).createTodoList(),
        todoListFactory.connect(user3).createTodoList(),
      ];

      await Promise.all(createPromises);

      // Get all TodoList contracts
      const todoListAddresses = await Promise.all([
        todoListFactory.getTodoListForUser(user1.address),
        todoListFactory.getTodoListForUser(user2.address),
        todoListFactory.getTodoListForUser(user3.address),
      ]);

      const todoLists = todoListAddresses.map(addr => TodoList.attach(addr));

      // Perform concurrent operations on different TodoLists
      const operationPromises = [
        todoLists[0].connect(user1).createTodo('Concurrent Todo 1', 'Description', 1),
        todoLists[1].connect(user2).createTodo('Concurrent Todo 2', 'Description', 2),
        todoLists[2].connect(user3).createTodo('Concurrent Todo 3', 'Description', 0),
      ];

      await Promise.all(operationPromises);

      // Verify all operations completed successfully
      const todos1 = await todoLists[0].connect(user1).getTodos();
      const todos2 = await todoLists[1].connect(user2).getTodos();
      const todos3 = await todoLists[2].connect(user3).getTodos();

      expect(todos1.length).to.equal(1);
      expect(todos2.length).to.equal(1);
      expect(todos3.length).to.equal(1);

      expect(todos1[0].title).to.equal('Concurrent Todo 1');
      expect(todos2[0].title).to.equal('Concurrent Todo 2');
      expect(todos3[0].title).to.equal('Concurrent Todo 3');
    });

    it('Should maintain data integrity under stress', async function () {
      // Create TodoList
      await todoListFactory.connect(user1).createTodoList();
      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoList = TodoList.attach(todoListAddress);

      // Create many todos rapidly (sequentially to guarantee order)
      for (let i = 0; i < 20; i++) {
        await todoList.connect(user1).createTodo(`Stress Test Todo ${i}`, `Description ${i}`, i % 3);
      }

      // Verify all todos were created
      const todos = await todoList.connect(user1).getTodos();
      expect(todos.length).to.equal(20);

      // Verify data integrity
      for (let i = 0; i < 20; i++) {
        expect(todos[i].title).to.equal(`Stress Test Todo ${i}`);
        expect(todos[i].description).to.equal(`Description ${i}`);
        expect(todos[i].priority).to.equal(i % 3);
      }

      // Perform mixed operations
      const mixedPromises = [
        todoList.connect(user1).toggleTodoCompletion(1),
        todoList.connect(user1).toggleTodoCompletion(5),
        todoList.connect(user1).toggleTodoCompletion(10),
        todoList.connect(user1).updateTodo(3, 'Updated Title', 'Updated Description', 2),
        todoList.connect(user1).deleteTodo(15),
      ];

      await Promise.all(mixedPromises);

      // Verify final state
      const finalTodos = await todoList.connect(user1).getTodos();
      expect(finalTodos.length).to.equal(19); // One deleted

      const stats = await todoList.connect(user1).getTodoStats();
      expect(stats.total).to.equal(19);
      expect(stats.completed).to.equal(3);
    });
  });

  describe('Performance and Scalability', function () {
    it('Should handle large-scale operations efficiently', async function () {
      // Create multiple users with TodoLists
      const numUsers = 10;
      const createPromises = [];

      for (let i = 0; i < numUsers; i++) {
        createPromises.push(todoListFactory.connect(addrs[i]).createTodoList());
      }

      const startTime = Date.now();
      await Promise.all(createPromises);
      const createEndTime = Date.now();

      // Should create TodoLists quickly
      expect(createEndTime - startTime).to.be.lessThan(15000); // 15 seconds

      // Verify all TodoLists were created
      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(numUsers);

      // Add todos to each TodoList
      const todoPromises = [];
      for (let i = 0; i < numUsers; i++) {
        const todoListAddress = await todoListFactory.getTodoListForUser(addrs[i].address);
        const todoList = TodoList.attach(todoListAddress);

        for (let j = 0; j < 5; j++) {
          todoPromises.push(todoList.connect(addrs[i]).createTodo(`User ${i} Todo ${j}`, `Description ${j}`, j % 3));
        }
      }

      const todoStartTime = Date.now();
      await Promise.all(todoPromises);
      const todoEndTime = Date.now();

      // Should create all todos efficiently
      expect(todoEndTime - todoStartTime).to.be.lessThan(20000); // 20 seconds

      // Verify all todos were created
      for (let i = 0; i < numUsers; i++) {
        const todoListAddress = await todoListFactory.getTodoListForUser(addrs[i].address);
        const todoList = TodoList.attach(todoListAddress);
        const todos = await todoList.connect(addrs[i]).getTodos();
        expect(todos.length).to.equal(5);
      }
    });

    it('Should maintain performance with complex operations', async function () {
      // Create TodoList with many todos
      await todoListFactory.connect(user1).createTodoList();
      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoList = TodoList.attach(todoListAddress);

      // Create maximum number of todos
      const maxTodos = 50;
      for (let i = 0; i < maxTodos; i++) {
        await todoList.connect(user1).createTodo(`Todo ${i}`, `Description ${i}`, i % 3);
      }

      // Perform complex operations
      const startTime = Date.now();

      // Get all todos
      const todos = await todoList.connect(user1).getTodos();
      expect(todos.length).to.equal(maxTodos);

      // Get statistics
      const stats = await todoList.connect(user1).getTodoStats();
      expect(stats.total).to.equal(maxTodos);

      // Complete some todos
      for (let i = 0; i < 10; i++) {
        await todoList.connect(user1).toggleTodoCompletion(i + 1);
      }

      // Update some todos
      for (let i = 10; i < 15; i++) {
        await todoList.connect(user1).updateTodo(i + 1, `Updated Todo ${i}`, `Updated Description ${i}`, 2);
      }

      // Delete some todos
      for (let i = 15; i < 20; i++) {
        await todoList.connect(user1).deleteTodo(i + 1);
      }

      const endTime = Date.now();

      // Operations should complete in reasonable time
      expect(endTime - startTime).to.be.lessThan(30000); // 30 seconds

      // Verify final state
      const finalTodos = await todoList.connect(user1).getTodos();
      expect(finalTodos.length).to.equal(45); // 5 deleted

      const finalStats = await todoList.connect(user1).getTodoStats();
      expect(finalStats.total).to.equal(45);
      expect(finalStats.completed).to.equal(10);
    });
  });

  describe('Upgrade and Migration Scenarios', function () {
    it('Should support data export for system migration', async function () {
      // Create comprehensive test data
      const testUsers = [user1, user2, user3];
      const migrationData = {
        factory: {},
        todoLists: {},
        todos: {},
      };

      // Create TodoLists and todos
      for (const user of testUsers) {
        await todoListFactory.connect(user).createTodoList();

        const todoListAddress = await todoListFactory.getTodoListForUser(user.address);
        const todoList = TodoList.attach(todoListAddress);

        // Create various todos
        await todoList.connect(user).createTodo(`${user.address} High Priority`, 'Important task', 2);
        await todoList.connect(user).createTodo(`${user.address} Medium Priority`, 'Regular task', 1);
        await todoList.connect(user).createTodo(`${user.address} Low Priority`, 'Optional task', 0);

        // Complete some todos
        await todoList.connect(user).toggleTodoCompletion(1);

        // Store migration data
        migrationData.todoLists[user.address] = todoListAddress;
        migrationData.todos[user.address] = await todoList.connect(user).getTodos();
      }

      // Export factory data
      migrationData.factory.userCount = await todoListFactory.getUserCount();
      migrationData.factory.users = await todoListFactory.getUsers(0, 10);

      // Verify migration data completeness
      expect(migrationData.factory.userCount).to.equal(3);
      expect(migrationData.factory.users.length).to.equal(3);

      for (const user of testUsers) {
        expect(migrationData.todoLists[user.address]).to.be.properAddress;
        expect(migrationData.todos[user.address].length).to.equal(3);
        expect(migrationData.todos[user.address][0].completed).to.be.true;
      }

      // Verify data can be used for migration
      expect(Object.keys(migrationData.todoLists)).to.have.length(3);
      expect(Object.keys(migrationData.todos)).to.have.length(3);
    });

    it('Should maintain referential integrity for migration', async function () {
      // Create complex data relationships
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();

      const user1TodoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoListAddress = await todoListFactory.getTodoListForUser(user2.address);

      const user1TodoList = TodoList.attach(user1TodoListAddress);
      const user2TodoList = TodoList.attach(user2TodoListAddress);

      // Create todos with relationships (same titles, different users)
      await user1TodoList.connect(user1).createTodo('Shared Task Name', 'User1 version', 1);
      await user2TodoList.connect(user2).createTodo('Shared Task Name', 'User2 version', 2);

      // Verify data integrity
      const user1Todos = await user1TodoList.connect(user1).getTodos();
      const user2Todos = await user2TodoList.connect(user2).getTodos();

      expect(user1Todos[0].title).to.equal('Shared Task Name');
      expect(user2Todos[0].title).to.equal('Shared Task Name');
      expect(user1Todos[0].description).to.equal('User1 version');
      expect(user2Todos[0].description).to.equal('User2 version');
      expect(user1Todos[0].priority).to.equal(1);
      expect(user2Todos[0].priority).to.equal(2);

      // Verify factory maintains correct references
      const factoryUser1Address = await todoListFactory.getTodoListForUser(user1.address);
      const factoryUser2Address = await todoListFactory.getTodoListForUser(user2.address);

      expect(factoryUser1Address).to.equal(user1TodoListAddress);
      expect(factoryUser2Address).to.equal(user2TodoListAddress);
    });
  });
});
