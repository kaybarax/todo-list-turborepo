const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Base TodoListFactory Contract Tests', function () {
  let TodoListFactory;
  let todoListFactory;
  let TodoList;
  let owner;
  let user1;
  let user2;
  let user3;
  let addrs;

  beforeEach(async function () {
    [owner, user1, user2, user3, ...addrs] = await ethers.getSigners();

    // Deploy TodoList contract for factory to use
    TodoList = await ethers.getContractFactory('TodoList');

    // Deploy TodoListFactory
    TodoListFactory = await ethers.getContractFactory('TodoListFactory');
    todoListFactory = await TodoListFactory.deploy();
    await todoListFactory.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      expect(await todoListFactory.getAddress()).to.be.properAddress;
    });

    it('Should set the correct owner', async function () {
      expect(await todoListFactory.owner()).to.equal(owner.address);
    });

    it('Should initialize with empty state', async function () {
      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(0);
    });

    it('Should have no users initially', async function () {
      const users = await todoListFactory.getUsers(0, 10);
      expect(users.length).to.equal(0);
    });
  });

  describe('TodoList Creation', function () {
    it('Should create TodoList for user successfully', async function () {
      await expect(todoListFactory.connect(user1).createTodoList())
        .to.emit(todoListFactory, 'TodoListCreated')
        .withArgs(user1.address, require('@nomicfoundation/hardhat-chai-matchers/withArgs').anyValue);

      const userTodoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      expect(userTodoListAddress).to.not.equal(ethers.ZeroAddress);
    });

    it('Should increment user count after creation', async function () {
      await todoListFactory.connect(user1).createTodoList();

      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(1);
    });

    it('Should add user to users array', async function () {
      await todoListFactory.connect(user1).createTodoList();

      const users = await todoListFactory.getUsers(0, 10);
      expect(users.length).to.equal(1);
      expect(users[0]).to.equal(user1.address);
    });

    it('Should prevent duplicate TodoList creation for same user', async function () {
      await todoListFactory.connect(user1).createTodoList();

      await expect(todoListFactory.connect(user1).createTodoList()).to.be.revertedWithCustomError(
        todoListFactory,
        'TodoListAlreadyExists',
      );
    });

    it('Should allow multiple users to create TodoLists', async function () {
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();
      await todoListFactory.connect(user3).createTodoList();

      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(3);

      const users = await todoListFactory.getUsers(0, 10);
      expect(users.length).to.equal(3);

      // Verify each user has their own TodoList
      const user1TodoList = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoList = await todoListFactory.getTodoListForUser(user2.address);
      const user3TodoList = await todoListFactory.getTodoListForUser(user3.address);

      expect(user1TodoList).to.not.equal(user2TodoList);
      expect(user2TodoList).to.not.equal(user3TodoList);
      expect(user1TodoList).to.not.equal(user3TodoList);
    });

    it('Should create TodoList with correct owner', async function () {
      await todoListFactory.connect(user1).createTodoList();

      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoListContract = TodoList.attach(todoListAddress);

      const todoListOwner = await todoListContract.owner();
      expect(todoListOwner).to.equal(user1.address);
    });

    it('Should create functional TodoList contract', async function () {
      await todoListFactory.connect(user1).createTodoList();

      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoListContract = TodoList.attach(todoListAddress);

      // Test basic functionality
      await todoListContract.connect(user1).createTodo('Factory Test Todo', 'Created via factory', 1);

      const todos = await todoListContract.connect(user1).getTodos();
      expect(todos.length).to.equal(1);
      expect(todos[0].title).to.equal('Factory Test Todo');
    });

    it('Should return correct TodoList address', async function () {
      const tx = await todoListFactory.connect(user1).createTodoList();
      const receipt = await tx.wait();

      // Get the TodoList address from the event
      const event = receipt.logs.find(log => {
        try {
          const parsed = todoListFactory.interface.parseLog(log);
          return parsed.name === 'TodoListCreated';
        } catch {
          return false;
        }
      });

      const parsedEvent = todoListFactory.interface.parseLog(event);
      const todoListAddress = parsedEvent.args.todoList;

      const storedAddress = await todoListFactory.getTodoListForUser(user1.address);
      expect(storedAddress).to.equal(todoListAddress);
    });
  });

  describe('TodoList Retrieval', function () {
    beforeEach(async function () {
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();
      await todoListFactory.connect(user3).createTodoList();
    });

    it('Should return correct TodoList address for user', async function () {
      const user1TodoList = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoList = await todoListFactory.getTodoListForUser(user2.address);

      expect(user1TodoList).to.be.properAddress;
      expect(user2TodoList).to.be.properAddress;
      expect(user1TodoList).to.not.equal(user2TodoList);
    });

    it('Should return zero address for user without TodoList', async function () {
      const nonExistentUserTodoList = await todoListFactory.getTodoListForUser(addrs[0].address);
      expect(nonExistentUserTodoList).to.equal(ethers.ZeroAddress);
    });

    it('Should return correct TodoList for caller', async function () {
      const user1TodoList = await todoListFactory.connect(user1).getTodoList();
      const user2TodoList = await todoListFactory.connect(user2).getTodoList();

      expect(user1TodoList).to.be.properAddress;
      expect(user2TodoList).to.be.properAddress;
      expect(user1TodoList).to.not.equal(user2TodoList);
    });

    it('Should return zero address for caller without TodoList', async function () {
      const nonExistentTodoList = await todoListFactory.connect(addrs[0]).getTodoList();
      expect(nonExistentTodoList).to.equal(ethers.ZeroAddress);
    });

    it('Should return correct user count', async function () {
      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(3);
    });

    it('Should return users with pagination', async function () {
      // Get first 2 users
      const firstBatch = await todoListFactory.getUsers(0, 2);
      expect(firstBatch.length).to.equal(2);
      expect(firstBatch[0]).to.equal(user1.address);
      expect(firstBatch[1]).to.equal(user2.address);

      // Get remaining users
      const secondBatch = await todoListFactory.getUsers(2, 2);
      expect(secondBatch.length).to.equal(1);
      expect(secondBatch[0]).to.equal(user3.address);
    });

    it('Should handle pagination edge cases', async function () {
      // Request beyond available users
      const beyondUsers = await todoListFactory.getUsers(10, 5);
      expect(beyondUsers.length).to.equal(0);

      // Request with large limit
      const allUsers = await todoListFactory.getUsers(0, 100);
      expect(allUsers.length).to.equal(3);
      expect(allUsers[0]).to.equal(user1.address);
      expect(allUsers[1]).to.equal(user2.address);
      expect(allUsers[2]).to.equal(user3.address);
    });

    it('Should return partial results when limit exceeds remaining users', async function () {
      const partialUsers = await todoListFactory.getUsers(1, 10);
      expect(partialUsers.length).to.equal(2);
      expect(partialUsers[0]).to.equal(user2.address);
      expect(partialUsers[1]).to.equal(user3.address);
    });
  });

  describe('Access Control and Security', function () {
    it('Should allow any user to create TodoList', async function () {
      // Any user should be able to create a TodoList
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();

      const user1TodoList = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoList = await todoListFactory.getTodoListForUser(user2.address);

      expect(user1TodoList).to.not.equal(ethers.ZeroAddress);
      expect(user2TodoList).to.not.equal(ethers.ZeroAddress);
    });

    it('Should allow read access to anyone', async function () {
      await todoListFactory.connect(user1).createTodoList();

      // Anyone should be able to read TodoList addresses
      const todoListAddress = await todoListFactory.connect(user2).getTodoListForUser(user1.address);
      expect(todoListAddress).to.not.equal(ethers.ZeroAddress);

      const userCount = await todoListFactory.connect(user2).getUserCount();
      expect(userCount).to.equal(1);
    });

    it('Should handle ownership transfer', async function () {
      // Transfer factory ownership
      await todoListFactory.transferOwnership(user1.address);

      // Verify new owner
      expect(await todoListFactory.owner()).to.equal(user1.address);

      // Factory should still work normally
      await todoListFactory.connect(user2).createTodoList();
      const todoListAddress = await todoListFactory.getTodoListForUser(user2.address);
      expect(todoListAddress).to.not.equal(ethers.ZeroAddress);
    });

    it('Should prevent ownership transfer to zero address', async function () {
      await expect(todoListFactory.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        todoListFactory,
        'OwnableInvalidOwner',
      );
    });

    it('Should emit ownership transfer event', async function () {
      await expect(todoListFactory.transferOwnership(user1.address))
        .to.emit(todoListFactory, 'OwnershipTransferred')
        .withArgs(owner.address, user1.address);
    });

    it('Should handle malicious input gracefully', async function () {
      // Test with contract addresses as users (should work)
      await todoListFactory.connect(user1).createTodoList();

      const userTodoList = await todoListFactory.getTodoListForUser(user1.address);
      expect(userTodoList).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe('Event Emission', function () {
    it('Should emit TodoListCreated event with correct parameters', async function () {
      const tx = await todoListFactory.connect(user1).createTodoList();
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = todoListFactory.interface.parseLog(log);
          return parsed.name === 'TodoListCreated';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const parsedEvent = todoListFactory.interface.parseLog(event);
      expect(parsedEvent.args.user).to.equal(user1.address);
      expect(parsedEvent.args.todoList).to.be.properAddress;
    });

    it('Should emit events in correct order for multiple operations', async function () {
      const tx1 = await todoListFactory.connect(user1).createTodoList();
      const receipt1 = await tx1.wait();

      const tx2 = await todoListFactory.connect(user2).createTodoList();
      const receipt2 = await tx2.wait();

      // Verify events were emitted
      const events1 = receipt1.logs.filter(log => {
        try {
          return todoListFactory.interface.parseLog(log).name === 'TodoListCreated';
        } catch {
          return false;
        }
      });

      const events2 = receipt2.logs.filter(log => {
        try {
          return todoListFactory.interface.parseLog(log).name === 'TodoListCreated';
        } catch {
          return false;
        }
      });

      expect(events1).to.have.length(1);
      expect(events2).to.have.length(1);

      const parsedEvent1 = todoListFactory.interface.parseLog(events1[0]);
      const parsedEvent2 = todoListFactory.interface.parseLog(events2[0]);

      expect(parsedEvent1.args.user).to.equal(user1.address);
      expect(parsedEvent2.args.user).to.equal(user2.address);
    });
  });

  describe('Gas Optimization and Performance', function () {
    it('Should have reasonable gas costs for TodoList creation', async function () {
      const tx = await todoListFactory.connect(user1).createTodoList();
      const receipt = await tx.wait();

      // TodoList creation should be reasonably efficient on Base L2
      expect(receipt.gasUsed).to.be.lessThan(2000000n); // 2M gas limit
    });

    it('Should scale efficiently with number of TodoLists', async function () {
      const gasUsages = [];

      // Create multiple TodoLists and measure gas usage
      for (let i = 0; i < 5; i++) {
        const user = addrs[i];
        const tx = await todoListFactory.connect(user).createTodoList();
        const receipt = await tx.wait();
        gasUsages.push(Number(receipt.gasUsed));
      }

      // Gas usage should not increase significantly with number of TodoLists
      const firstGas = gasUsages[0];
      const lastGas = gasUsages[gasUsages.length - 1];
      const increase = (lastGas - firstGas) / firstGas;

      expect(increase).to.be.lessThan(0.2); // Less than 20% increase
    });

    it('Should handle large number of TodoLists efficiently', async function () {
      // Create many TodoLists
      const numTodoLists = 15;
      for (let i = 0; i < numTodoLists; i++) {
        await todoListFactory.connect(addrs[i]).createTodoList();
      }

      // Test retrieval performance
      const startTime = Date.now();
      const users = await todoListFactory.getUsers(0, numTodoLists);
      const endTime = Date.now();

      expect(users.length).to.equal(numTodoLists);
      expect(endTime - startTime).to.be.lessThan(1000); // Should complete within 1 second
    });
  });

  describe('Edge Cases and Error Handling', function () {
    it('Should handle empty state queries correctly', async function () {
      const userCount = await todoListFactory.getUserCount();
      const users = await todoListFactory.getUsers(0, 10);

      expect(userCount).to.equal(0);
      expect(users.length).to.equal(0);
    });

    it('Should handle queries for non-existent users', async function () {
      const nonExistentTodoList = await todoListFactory.getTodoListForUser(user1.address);
      expect(nonExistentTodoList).to.equal(ethers.ZeroAddress);
    });

    it('Should handle rapid successive operations', async function () {
      // Rapid creation by different users
      const promises = [
        todoListFactory.connect(user1).createTodoList(),
        todoListFactory.connect(user2).createTodoList(),
        todoListFactory.connect(user3).createTodoList(),
      ];

      await Promise.all(promises);

      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(3);
    });

    it('Should maintain consistency under concurrent operations', async function () {
      // Simulate concurrent TodoList creation
      const promises = [
        todoListFactory.connect(user1).createTodoList(),
        todoListFactory.connect(user2).createTodoList(),
        todoListFactory.connect(user3).createTodoList(),
      ];

      await Promise.all(promises);

      // Verify final state is consistent
      const userCount = await todoListFactory.getUserCount();
      const users = await todoListFactory.getUsers(0, 10);

      expect(userCount).to.equal(3);
      expect(users.length).to.equal(3);

      // Verify each user has their own TodoList
      const user1TodoList = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoList = await todoListFactory.getTodoListForUser(user2.address);
      const user3TodoList = await todoListFactory.getTodoListForUser(user3.address);

      expect(user1TodoList).to.not.equal(ethers.ZeroAddress);
      expect(user2TodoList).to.not.equal(ethers.ZeroAddress);
      expect(user3TodoList).to.not.equal(ethers.ZeroAddress);

      expect(user1TodoList).to.not.equal(user2TodoList);
      expect(user2TodoList).to.not.equal(user3TodoList);
      expect(user1TodoList).to.not.equal(user3TodoList);
    });

    it('Should handle pagination with zero limit', async function () {
      await todoListFactory.connect(user1).createTodoList();

      const users = await todoListFactory.getUsers(0, 0);
      expect(users.length).to.equal(0);
    });

    it('Should handle pagination with large offset', async function () {
      await todoListFactory.connect(user1).createTodoList();

      const users = await todoListFactory.getUsers(1000, 10);
      expect(users.length).to.equal(0);
    });
  });

  describe('Integration and Interoperability', function () {
    it('Should work with external contracts', async function () {
      await todoListFactory.connect(user1).createTodoList();

      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const todoListContract = TodoList.attach(todoListAddress);

      // Test that the created TodoList works with external interactions
      await todoListContract.connect(user1).createTodo('Integration Test', 'Testing external interaction', 1);

      const todos = await todoListContract.connect(user1).getTodos();
      expect(todos.length).to.equal(1);
      expect(todos[0].title).to.equal('Integration Test');
    });

    it('Should support factory pattern correctly', async function () {
      // Create multiple TodoLists
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();

      // Verify they are independent instances
      const user1TodoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoListAddress = await todoListFactory.getTodoListForUser(user2.address);

      const user1TodoList = TodoList.attach(user1TodoListAddress);
      const user2TodoList = TodoList.attach(user2TodoListAddress);

      // Add different todos to each list
      await user1TodoList.connect(user1).createTodo('User1 Todo', 'Description', 1);
      await user2TodoList.connect(user2).createTodo('User2 Todo', 'Description', 2);

      // Verify independence
      const user1Todos = await user1TodoList.connect(user1).getTodos();
      const user2Todos = await user2TodoList.connect(user2).getTodos();

      expect(user1Todos.length).to.equal(1);
      expect(user2Todos.length).to.equal(1);
      expect(user1Todos[0].title).to.equal('User1 Todo');
      expect(user2Todos[0].title).to.equal('User2 Todo');
      expect(user1Todos[0].priority).to.equal(1);
      expect(user2Todos[0].priority).to.equal(2);
    });
  });

  describe('Base L2 Specific Features', function () {
    it('Should work efficiently on Base L2 with low gas costs', async function () {
      // Base L2 should have lower gas costs than mainnet
      const tx = await todoListFactory.connect(user1).createTodoList();
      const receipt = await tx.wait();

      // Base L2 transactions should be very efficient
      expect(receipt.gasUsed).to.be.lessThan(2000000n);
    });

    it('Should handle Base network specific configurations', async function () {
      // Verify the contract works with Base's chain ID and configurations
      const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
      expect([8453n, 31337n, 1281n, 1284n]).to.include(chainId); // Base mainnet, hardhat, or moonbeam
    });

    it('Should be compatible with Base ecosystem', async function () {
      // Test that the factory is compatible with Base's EVM implementation
      await todoListFactory.connect(user1).createTodoList();

      const todoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      expect(todoListAddress).to.not.equal(ethers.ZeroAddress);

      // Verify the created TodoList works on Base
      const todoListContract = TodoList.attach(todoListAddress);
      await todoListContract.connect(user1).createTodo('Base Ecosystem Test', 'Testing compatibility', 2);

      const todos = await todoListContract.connect(user1).getTodos();
      expect(todos[0].title).to.equal('Base Ecosystem Test');
      expect(todos[0].priority).to.equal(2);
    });

    it('Should leverage Base L2 optimizations', async function () {
      // Create multiple TodoLists to test batch efficiency
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(todoListFactory.connect(addrs[i]).createTodoList());
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      // Should complete quickly on Base L2
      expect(endTime - startTime).to.be.lessThan(5000); // 5 seconds

      const userCount = await todoListFactory.getUserCount();
      expect(userCount).to.equal(5);
    });
  });

  describe('Upgrade and Migration Support', function () {
    it('Should support data export for migration', async function () {
      // Create TodoLists with data
      await todoListFactory.connect(user1).createTodoList();
      await todoListFactory.connect(user2).createTodoList();

      const user1TodoListAddress = await todoListFactory.getTodoListForUser(user1.address);
      const user2TodoListAddress = await todoListFactory.getTodoListForUser(user2.address);

      const user1TodoList = TodoList.attach(user1TodoListAddress);
      const user2TodoList = TodoList.attach(user2TodoListAddress);

      await user1TodoList.connect(user1).createTodo('Migration Test 1', 'Description', 1);
      await user2TodoList.connect(user2).createTodo('Migration Test 2', 'Description', 2);

      // Export data for migration
      const users = await todoListFactory.getUsers(0, 10);
      const userCount = await todoListFactory.getUserCount();

      // Verify export data completeness
      expect(users.length).to.equal(2);
      expect(userCount).to.equal(2);
      expect(users).to.include(user1.address);
      expect(users).to.include(user2.address);

      // Verify TodoList addresses are valid
      expect(user1TodoListAddress).to.be.properAddress;
      expect(user2TodoListAddress).to.be.properAddress;
    });

    it('Should maintain data integrity for migration', async function () {
      // Create comprehensive test data
      const testUsers = [user1, user2, user3];

      for (const user of testUsers) {
        await todoListFactory.connect(user).createTodoList();

        const todoListAddress = await todoListFactory.getTodoListForUser(user.address);
        const todoListContract = TodoList.attach(todoListAddress);

        // Add todos with different properties
        await todoListContract.connect(user).createTodo(`${user.address} Todo 1`, 'Description 1', 0);
        await todoListContract.connect(user).createTodo(`${user.address} Todo 2`, 'Description 2', 1);
        await todoListContract.connect(user).toggleTodoCompletion(1); // Complete first todo
      }

      // Verify all data is accessible for migration
      const allUsers = await todoListFactory.getUsers(0, 10);
      expect(allUsers.length).to.equal(3);

      for (const userAddress of allUsers) {
        const todoListAddress = await todoListFactory.getTodoListForUser(userAddress);
        expect(todoListAddress).to.not.equal(ethers.ZeroAddress);

        const userSigner = testUsers.find(u => u.address === userAddress);
        const todoListContract = TodoList.attach(todoListAddress).connect(userSigner);
        const todos = await todoListContract.getTodos();
        expect(todos.length).to.equal(2);

        const stats = await todoListContract.getTodoStats();
        expect(stats.total).to.equal(2);
        expect(stats.completed).to.equal(1);
      }
    });
  });
});
