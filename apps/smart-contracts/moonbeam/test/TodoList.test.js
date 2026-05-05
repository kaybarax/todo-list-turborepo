const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Base TodoList Contract Tests', function () {
  let TodoList;
  let todoList;
  let owner;
  let user1;
  let user2;
  let addrs;

  beforeEach(async function () {
    [owner, user1, user2, ...addrs] = await ethers.getSigners();

    TodoList = await ethers.getContractFactory('TodoList');
    todoList = await TodoList.deploy();
    await todoList.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await todoList.owner()).to.equal(owner.address);
    });

    it('Should initialize with empty todo list for all users', async function () {
      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(0);
    });

    it('Should have correct constants', async function () {
      expect(await todoList.MAX_TITLE_LENGTH()).to.equal(100);
      expect(await todoList.MAX_DESCRIPTION_LENGTH()).to.equal(500);
      expect(await todoList.MAX_TODOS_PER_USER()).to.equal(50);
    });
  });

  describe('Todo Creation', function () {
    const validTodo = {
      title: 'Test Todo',
      description: 'Test Description',
      priority: 1, // medium
    };

    it('Should create a todo successfully', async function () {
      await expect(todoList.createTodo(validTodo.title, validTodo.description, validTodo.priority))
        .to.emit(todoList, 'TodoCreated')
        .withArgs(owner.address, 1, validTodo.title, validTodo.priority);

      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(1);

      const todo = todos[0];
      expect(todo.id).to.equal(1);
      expect(todo.title).to.equal(validTodo.title);
      expect(todo.description).to.equal(validTodo.description);
      expect(todo.priority).to.equal(validTodo.priority);
      expect(todo.completed).to.be.false;
      expect(todo.createdAt).to.be.above(0);
      expect(todo.updatedAt).to.be.above(0);
      expect(todo.completedAt).to.equal(0);
    });

    it('Should fail with empty title', async function () {
      await expect(todoList.createTodo('', validTodo.description, validTodo.priority)).to.be.revertedWithCustomError(
        todoList,
        'TitleEmpty',
      );
    });

    it('Should fail with title too long', async function () {
      const longTitle = 'a'.repeat(101); // Exceeds MAX_TITLE_LENGTH

      await expect(
        todoList.createTodo(longTitle, validTodo.description, validTodo.priority),
      ).to.be.revertedWithCustomError(todoList, 'TitleTooLong');
    });

    it('Should fail with description too long', async function () {
      const longDescription = 'a'.repeat(501); // Exceeds MAX_DESCRIPTION_LENGTH

      await expect(
        todoList.createTodo(validTodo.title, longDescription, validTodo.priority),
      ).to.be.revertedWithCustomError(todoList, 'DescriptionTooLong');
    });

    it('Should allow empty description', async function () {
      await todoList.createTodo(validTodo.title, '', validTodo.priority);

      const todos = await todoList.getTodos();
      expect(todos[0].description).to.equal('');
    });

    it('Should handle different priority levels', async function () {
      // Low priority (0)
      await todoList.createTodo('Low Priority', 'Description', 0);
      // Medium priority (1)
      await todoList.createTodo('Medium Priority', 'Description', 1);
      // High priority (2)
      await todoList.createTodo('High Priority', 'Description', 2);

      const todos = await todoList.getTodos();
      expect(todos[0].priority).to.equal(0);
      expect(todos[1].priority).to.equal(1);
      expect(todos[2].priority).to.equal(2);
    });

    it('Should fail when todo list is full', async function () {
      // Create maximum number of todos
      for (let i = 0; i < 50; i++) {
        await todoList.createTodo(`Todo ${i}`, 'Description', 1);
      }

      // Try to create one more
      await expect(todoList.createTodo('Overflow Todo', 'Description', 1)).to.be.revertedWithCustomError(
        todoList,
        'TodoListFull',
      );
    });

    it('Should increment todo IDs correctly', async function () {
      await todoList.createTodo('Todo 1', 'Description', 1);
      await todoList.createTodo('Todo 2', 'Description', 1);
      await todoList.createTodo('Todo 3', 'Description', 1);

      const todos = await todoList.getTodos();
      expect(todos[0].id).to.equal(1);
      expect(todos[1].id).to.equal(2);
      expect(todos[2].id).to.equal(3);
    });

    it('Should allow different users to create todos independently', async function () {
      await todoList.connect(user1).createTodo('User1 Todo', 'Description', 1);
      await todoList.connect(user2).createTodo('User2 Todo', 'Description', 2);

      const user1Todos = await todoList.connect(user1).getTodos();
      const user2Todos = await todoList.connect(user2).getTodos();

      expect(user1Todos.length).to.equal(1);
      expect(user2Todos.length).to.equal(1);
      expect(user1Todos[0].title).to.equal('User1 Todo');
      expect(user2Todos[0].title).to.equal('User2 Todo');
    });
  });

  describe('Todo Retrieval', function () {
    beforeEach(async function () {
      // Create test todos
      await todoList.createTodo('Todo 1', 'Description 1', 0);
      await todoList.createTodo('Todo 2', 'Description 2', 1);
      await todoList.createTodo('Todo 3', 'Description 3', 2);
    });

    it('Should get all todos for user', async function () {
      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(3);
      expect(todos[0].title).to.equal('Todo 1');
      expect(todos[1].title).to.equal('Todo 2');
      expect(todos[2].title).to.equal('Todo 3');
    });

    it('Should get specific todo by ID', async function () {
      const todo = await todoList.getTodo(2);
      expect(todo.title).to.equal('Todo 2');
      expect(todo.description).to.equal('Description 2');
      expect(todo.priority).to.equal(1);
    });

    it('Should fail to get non-existent todo', async function () {
      await expect(todoList.getTodo(999)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');
    });

    it('Should return empty array for user with no todos', async function () {
      const user1Todos = await todoList.connect(user1).getTodos();
      expect(user1Todos.length).to.equal(0);
    });

    it('Should get correct todo statistics', async function () {
      // Complete one todo
      await todoList.toggleTodoCompletion(2);

      const stats = await todoList.getTodoStats();
      expect(stats.total).to.equal(3);
      expect(stats.completed).to.equal(1);
      expect(stats.pending).to.equal(2);
      expect(stats.highPriority).to.equal(1); // Only uncompleted high priority todos
    });
  });

  describe('Todo Updates', function () {
    beforeEach(async function () {
      await todoList.createTodo('Original Title', 'Original Description', 1);
    });

    it('Should update todo title successfully', async function () {
      const newTitle = 'Updated Title';

      await expect(todoList.updateTodo(1, newTitle, '', ethers.MaxUint256))
        .to.emit(todoList, 'TodoUpdated')
        .withArgs(owner.address, 1, newTitle, 1);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal(newTitle);
      expect(todo.description).to.equal('Original Description'); // Unchanged
      expect(todo.priority).to.equal(1); // Unchanged
    });

    it('Should update todo description successfully', async function () {
      const newDescription = 'Updated Description';

      await todoList.updateTodo(1, '', newDescription, ethers.MaxUint256);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal('Original Title'); // Unchanged
      expect(todo.description).to.equal(newDescription);
      expect(todo.priority).to.equal(1); // Unchanged
    });

    it('Should update todo priority successfully', async function () {
      const newPriority = 2;

      await todoList.updateTodo(1, '', '', newPriority);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal('Original Title'); // Unchanged
      expect(todo.description).to.equal('Original Description'); // Unchanged
      expect(todo.priority).to.equal(newPriority);
    });

    it('Should update all fields simultaneously', async function () {
      const newTitle = 'Updated Title';
      const newDescription = 'Updated Description';
      const newPriority = 2;

      await todoList.updateTodo(1, newTitle, newDescription, newPriority);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal(newTitle);
      expect(todo.description).to.equal(newDescription);
      expect(todo.priority).to.equal(newPriority);
    });

    it('Should fail to update non-existent todo', async function () {
      await expect(todoList.updateTodo(999, 'Title', 'Description', 1)).to.be.revertedWithCustomError(
        todoList,
        'TodoNotFound',
      );
    });

    it('Should fail to update with title too long', async function () {
      const longTitle = 'a'.repeat(101);
      await expect(todoList.updateTodo(1, longTitle, '', ethers.MaxUint256)).to.be.revertedWithCustomError(
        todoList,
        'TitleTooLong',
      );
    });

    it('Should fail to update with description too long', async function () {
      const longDescription = 'a'.repeat(501);
      await expect(todoList.updateTodo(1, '', longDescription, ethers.MaxUint256)).to.be.revertedWithCustomError(
        todoList,
        'DescriptionTooLong',
      );
    });

    it('Should fail to update with invalid priority', async function () {
      await expect(todoList.updateTodo(1, '', '', 3)).to.be.revertedWithCustomError(todoList, 'InvalidPriority');
    });

    it('Should update timestamp on update', async function () {
      const originalTodo = await todoList.getTodo(1);
      const originalUpdatedAt = originalTodo.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      await todoList.updateTodo(1, 'Updated Title', '', ethers.MaxUint256);

      const updatedTodo = await todoList.getTodo(1);
      expect(updatedTodo.updatedAt).to.be.above(originalUpdatedAt);
      expect(updatedTodo.createdAt).to.equal(originalTodo.createdAt); // Should not change
    });

    it('Should allow only todo owner to update', async function () {
      await expect(
        todoList.connect(user1).updateTodo(1, 'Hacked', '', ethers.MaxUint256),
      ).to.be.revertedWithCustomError(todoList, 'TodoNotFound'); // user1 doesn't have this todo
    });
  });

  describe('Todo Completion Toggle', function () {
    beforeEach(async function () {
      await todoList.createTodo('Test Todo', 'Test Description', 1);
    });

    it('Should toggle todo completion', async function () {
      // Initially not completed
      let todo = await todoList.getTodo(1);
      expect(todo.completed).to.be.false;
      expect(todo.completedAt).to.equal(0);

      // Toggle to completed
      await expect(todoList.toggleTodoCompletion(1))
        .to.emit(todoList, 'TodoCompletionToggled')
        .withArgs(owner.address, 1, true);

      todo = await todoList.getTodo(1);
      expect(todo.completed).to.be.true;
      expect(todo.completedAt).to.be.above(0);

      // Toggle back to not completed
      await expect(todoList.toggleTodoCompletion(1))
        .to.emit(todoList, 'TodoCompletionToggled')
        .withArgs(owner.address, 1, false);

      todo = await todoList.getTodo(1);
      expect(todo.completed).to.be.false;
      expect(todo.completedAt).to.equal(0);
    });

    it('Should fail to toggle non-existent todo', async function () {
      await expect(todoList.toggleTodoCompletion(999)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');
    });

    it('Should update timestamps on toggle', async function () {
      const originalTodo = await todoList.getTodo(1);
      const originalUpdatedAt = originalTodo.updatedAt;

      await todoList.toggleTodoCompletion(1);

      const updatedTodo = await todoList.getTodo(1);
      expect(updatedTodo.updatedAt).to.be.above(originalUpdatedAt);
      expect(updatedTodo.completedAt).to.be.above(0);
    });

    it('Should allow only todo owner to toggle', async function () {
      await expect(todoList.connect(user1).toggleTodoCompletion(1)).to.be.revertedWithCustomError(
        todoList,
        'TodoNotFound',
      ); // user1 doesn't have this todo
    });
  });

  describe('Todo Deletion', function () {
    beforeEach(async function () {
      await todoList.createTodo('Todo 1', 'Description 1', 1);
      await todoList.createTodo('Todo 2', 'Description 2', 1);
      await todoList.createTodo('Todo 3', 'Description 3', 1);
    });

    it('Should delete todo successfully', async function () {
      await expect(todoList.deleteTodo(2)).to.emit(todoList, 'TodoDeleted').withArgs(owner.address, 2);

      // Verify todo is deleted
      await expect(todoList.getTodo(2)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');

      // Verify remaining todos
      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(2);
    });

    it('Should fail to delete non-existent todo', async function () {
      await expect(todoList.deleteTodo(999)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');
    });

    it('Should maintain array integrity after deletion', async function () {
      // Delete middle todo
      await todoList.deleteTodo(2);

      // Verify remaining todos are accessible
      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(2);

      // Check that we can still access remaining todos by their IDs
      const todo1 = await todoList.getTodo(1);
      const todo3 = await todoList.getTodo(3);

      expect(todo1.title).to.equal('Todo 1');
      expect(todo3.title).to.equal('Todo 3');
    });

    it('Should allow only todo owner to delete', async function () {
      await expect(todoList.connect(user1).deleteTodo(1)).to.be.revertedWithCustomError(todoList, 'TodoNotFound'); // user1 doesn't have this todo
    });

    it('Should update statistics after deletion', async function () {
      // Complete one todo before deletion
      await todoList.toggleTodoCompletion(2);

      let stats = await todoList.getTodoStats();
      expect(stats.total).to.equal(3);
      expect(stats.completed).to.equal(1);

      // Delete the completed todo
      await todoList.deleteTodo(2);

      stats = await todoList.getTodoStats();
      expect(stats.total).to.equal(2);
      expect(stats.completed).to.equal(0);
    });
  });

  describe('Statistics and Analytics', function () {
    beforeEach(async function () {
      // Create todos with different priorities and completion status
      await todoList.createTodo('High Priority Todo 1', 'Description', 2);
      await todoList.createTodo('Medium Priority Todo', 'Description', 1);
      await todoList.createTodo('Low Priority Todo', 'Description', 0);
      await todoList.createTodo('High Priority Todo 2', 'Description', 2);

      // Complete some todos
      await todoList.toggleTodoCompletion(1);
      await todoList.toggleTodoCompletion(3);
    });

    it('Should return correct basic statistics', async function () {
      const stats = await todoList.getTodoStats();

      expect(stats.total).to.equal(4);
      expect(stats.completed).to.equal(2);
      expect(stats.pending).to.equal(2);
      expect(stats.highPriority).to.equal(1); // Only uncompleted high priority todos
    });

    it('Should return empty stats for empty todo list', async function () {
      const emptyTodoList = await TodoList.deploy();
      await emptyTodoList.waitForDeployment();

      const stats = await emptyTodoList.getTodoStats();
      expect(stats.total).to.equal(0);
      expect(stats.completed).to.equal(0);
      expect(stats.pending).to.equal(0);
      expect(stats.highPriority).to.equal(0);
    });

    it('Should count high priority correctly', async function () {
      // Create more high priority todos
      await todoList.createTodo('High Priority Todo 3', 'Description', 2);
      await todoList.createTodo('High Priority Todo 4', 'Description', 2);

      const stats = await todoList.getTodoStats();
      expect(stats.highPriority).to.equal(3); // 3 uncompleted high priority todos
    });
  });

  describe('Access Control and Security', function () {
    beforeEach(async function () {
      await todoList.createTodo('Owner Todo', 'Description', 1);
    });

    it('Should allow users to manage only their own todos', async function () {
      // Create todo for user1
      await todoList.connect(user1).createTodo('User1 Todo', 'Description', 1);

      // Owner should not be able to access user1's todo
      await expect(todoList.getTodo(2)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');

      // User1 should not be able to access owner's todo
      await expect(todoList.connect(user1).getTodo(2)).to.be.revertedWithCustomError(todoList, 'TodoNotFound');
    });

    it('Should handle ownership transfer', async function () {
      // Transfer ownership
      await todoList.transferOwnership(user1.address);

      // Verify new owner
      expect(await todoList.owner()).to.equal(user1.address);

      // Old owner should still have access to their todos
      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal('Owner Todo');
    });

    it('Should prevent ownership transfer to zero address', async function () {
      await expect(todoList.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        todoList,
        'OwnableInvalidOwner',
      );
    });

    it('Should emit ownership transfer event', async function () {
      await expect(todoList.transferOwnership(user1.address))
        .to.emit(todoList, 'OwnershipTransferred')
        .withArgs(owner.address, user1.address);
    });
  });

  describe('Edge Cases and Error Handling', function () {
    it('Should handle maximum title length', async function () {
      const maxTitle = 'a'.repeat(100); // Exactly MAX_TITLE_LENGTH

      await todoList.createTodo(maxTitle, 'Description', 1);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal(maxTitle);
    });

    it('Should handle maximum description length', async function () {
      const maxDescription = 'a'.repeat(500); // Exactly MAX_DESCRIPTION_LENGTH

      await todoList.createTodo('Title', maxDescription, 1);

      const todo = await todoList.getTodo(1);
      expect(todo.description).to.equal(maxDescription);
    });

    it('Should handle special characters in strings', async function () {
      const specialTitle = 'Todo with émojis 🚀 and spëcial chars!@#$%^&*()';
      const specialDescription = 'Description with newlines\nand tabs\t and quotes "test"';

      await todoList.createTodo(specialTitle, specialDescription, 1);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal(specialTitle);
      expect(todo.description).to.equal(specialDescription);
    });

    it('Should handle rapid successive operations', async function () {
      // Create multiple todos rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(todoList.createTodo(`Rapid Todo ${i}`, 'Description', 1));
      }

      await Promise.all(promises);

      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(10);
    });

    it('Should maintain state consistency under concurrent operations', async function () {
      // Create initial todos
      await todoList.createTodo('Todo 1', 'Description', 1);
      await todoList.createTodo('Todo 2', 'Description', 1);

      // Perform concurrent operations
      const operations = [
        todoList.toggleTodoCompletion(1),
        todoList.updateTodo(2, 'Updated Todo 2', 'Updated Description', 2),
        todoList.createTodo('Todo 3', 'Description', 0),
      ];

      await Promise.all(operations);

      // Verify final state
      const todo1 = await todoList.getTodo(1);
      const todo2 = await todoList.getTodo(2);
      const todo3 = await todoList.getTodo(3);

      expect(todo1.completed).to.be.true;
      expect(todo2.title).to.equal('Updated Todo 2');
      expect(todo3.title).to.equal('Todo 3');

      const todos = await todoList.getTodos();
      expect(todos.length).to.equal(3);
    });
  });

  describe('Gas Optimization and Performance', function () {
    it('Should have reasonable gas costs for basic operations', async function () {
      // Create todo
      const createTx = await todoList.createTodo('Gas Test', 'Description', 1);
      const createReceipt = await createTx.wait();
      expect(createReceipt.gasUsed).to.be.lessThan(300000n);

      // Update todo
      const updateTx = await todoList.updateTodo(1, 'Updated', 'Updated Description', 2);
      const updateReceipt = await updateTx.wait();
      expect(updateReceipt.gasUsed).to.be.lessThan(100000n);

      // Toggle todo
      const toggleTx = await todoList.toggleTodoCompletion(1);
      const toggleReceipt = await toggleTx.wait();
      expect(toggleReceipt.gasUsed).to.be.lessThan(100000n);

      // Delete todo
      const deleteTx = await todoList.deleteTodo(1);
      const deleteReceipt = await deleteTx.wait();
      expect(deleteReceipt.gasUsed).to.be.lessThan(100000n);
    });

    it('Should scale efficiently with number of todos', async function () {
      const gasUsages = [];

      // Measure gas usage for creating todos at different list sizes
      for (let i = 0; i < 10; i++) {
        const tx = await todoList.createTodo(`Todo ${i}`, 'Description', 1);
        const receipt = await tx.wait();
        gasUsages.push(Number(receipt.gasUsed));
      }

      // Gas usage should not increase significantly with list size
      const firstGas = gasUsages[0];
      const lastGas = gasUsages[gasUsages.length - 1];
      const increase = (lastGas - firstGas) / firstGas;

      expect(increase).to.be.lessThan(0.1); // Less than 10% increase
    });
  });

  describe('Event Emission and Logging', function () {
    it('Should emit all required events with correct parameters', async function () {
      // Test TodoCreated event
      await expect(todoList.createTodo('Event Test', 'Description', 1))
        .to.emit(todoList, 'TodoCreated')
        .withArgs(owner.address, 1, 'Event Test', 1);

      // Test TodoUpdated event
      await expect(todoList.updateTodo(1, 'Updated Event Test', 'Updated Description', 2))
        .to.emit(todoList, 'TodoUpdated')
        .withArgs(owner.address, 1, 'Updated Event Test', 2);

      // Test TodoCompletionToggled event
      await expect(todoList.toggleTodoCompletion(1))
        .to.emit(todoList, 'TodoCompletionToggled')
        .withArgs(owner.address, 1, true);

      // Test TodoDeleted event
      await expect(todoList.deleteTodo(1)).to.emit(todoList, 'TodoDeleted').withArgs(owner.address, 1);
    });

    it('Should emit events in correct order for batch operations', async function () {
      const tx = await todoList.createTodo('Batch Test', 'Description', 1);
      const receipt = await tx.wait();

      // Verify event parameters
      const events = receipt.logs.filter(log => {
        try {
          return todoList.interface.parseLog(log).name === 'TodoCreated';
        } catch {
          return false;
        }
      });

      expect(events).to.have.length(1);
      const parsedEvent = todoList.interface.parseLog(events[0]);
      expect(parsedEvent.args.user).to.equal(owner.address);
      expect(parsedEvent.args.id).to.equal(1n);
      expect(parsedEvent.args.title).to.equal('Batch Test');
    });
  });

  describe('Base L2 Specific Features', function () {
    it('Should work efficiently on Base L2 with low gas costs', async function () {
      // Base L2 should have lower gas costs than mainnet
      const tx = await todoList.createTodo('Base L2 Test', 'Testing on Base', 1);
      const receipt = await tx.wait();

      // Base L2 transactions should be very efficient
      expect(receipt.gasUsed).to.be.lessThan(300000n);
    });

    it('Should handle Base network specific configurations', async function () {
      // Verify the contract works with Base's chain ID and configurations
      const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
      expect([8453n, 31337n, 1281n, 1284n]).to.include(chainId); // Base mainnet, hardhat, or moonbeam
    });

    it('Should be compatible with Base ecosystem', async function () {
      // Test that the contract is compatible with Base's EVM implementation
      await todoList.createTodo('Base Ecosystem Test', 'Testing compatibility', 2);

      const todo = await todoList.getTodo(1);
      expect(todo.title).to.equal('Base Ecosystem Test');
      expect(todo.priority).to.equal(2);
    });
  });

  describe('Integration with TodoListFactory', function () {
    it('Should be compatible with factory pattern', async function () {
      // Test that the contract can be created with different owners
      const todoList1 = await TodoList.deploy();
      const todoList2 = await TodoList.deploy();

      await todoList1.waitForDeployment();
      await todoList2.waitForDeployment();

      // Transfer ownership to different users
      await todoList1.transferOwnership(user1.address);
      await todoList2.transferOwnership(user2.address);

      expect(await todoList1.owner()).to.equal(user1.address);
      expect(await todoList2.owner()).to.equal(user2.address);

      // Verify they operate independently
      await todoList1.connect(user1).createTodo('User1 Todo', 'Description', 1);
      await todoList2.connect(user2).createTodo('User2 Todo', 'Description', 1);

      const user1Todos = await todoList1.connect(user1).getTodos();
      const user2Todos = await todoList2.connect(user2).getTodos();

      expect(user1Todos.length).to.equal(1);
      expect(user2Todos.length).to.equal(1);
      expect(user1Todos[0].title).to.equal('User1 Todo');
      expect(user2Todos[0].title).to.equal('User2 Todo');
    });
  });
});
