# Polygon Todo Smart Contracts

A set of smart contracts for managing todo items on the Polygon blockchain.

## Features

- **Decentralized Storage**: All todos are stored on-chain
- **User-Owned Data**: Each user has their own todo list
- **CRUD Operations**: Create, read, update, and delete todos
- **Priority Levels**: Support for Low, Medium, and High priority todos
- **Completion Tracking**: Mark todos as complete/incomplete with timestamps
- **Statistics**: Get todo statistics (total, completed, pending, high priority)
- **Factory Pattern**: TodoListFactory for easy deployment and discovery

## Smart Contracts

### TodoList.sol

The main contract for managing todo items. Each user gets their own instance of this contract.

#### Functions

- `createTodo(string title, string description, Priority priority)`: Create a new todo
- `updateTodo(uint256 id, string title, string description, uint256 priority)`: Update an existing todo
- `toggleTodoCompletion(uint256 id)`: Toggle the completion status of a todo
- `deleteTodo(uint256 id)`: Delete a todo
- `getTodos()`: Get all todos for the caller
- `getTodo(uint256 id)`: Get a specific todo by ID
- `getTodoStats()`: Get todo statistics for the caller

### TodoListFactory.sol

A factory contract for deploying TodoList contracts and keeping track of them.

#### Functions

- `createTodoList()`: Create a new TodoList contract for the caller
- `getTodoList()`: Get the TodoList contract for the caller
- `getTodoListForUser(address user)`: Get the TodoList contract for a specific user
- `getUserCount()`: Get the number of users who have created TodoLists
- `getUsers(uint256 offset, uint256 limit)`: Get a list of users who have created TodoLists

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Installation

```bash
# Install dependencies
yarn install
```

### Compilation

```bash
# Compile contracts
yarn compile
```

### Testing

```bash
# Run tests
yarn test

# Run tests with coverage
yarn coverage
```

### Deployment

#### Local Deployment

```bash
# Start a local node
yarn node

# In a new terminal, deploy contracts
yarn deploy:local

# Create a TodoList for the deployer
npx hardhat run scripts/create-todo-list.js --network localhost

# Create sample todos
npx hardhat run scripts/create-sample-todos.js --network localhost
```

#### Mumbai Testnet Deployment

1. Create a `.env` file based on `.env.example`:

```bash
POLYGON_RPC_URL=https://polygon-rpc.com
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0xYourPrivateKeyHere
POLYGONSCAN_API_KEY=YourPolygonscanApiKeyHere
```

2. Deploy to Mumbai:

```bash
yarn deploy:mumbai
```

3. Create a TodoList and sample todos:

```bash
npx hardhat run scripts/create-todo-list.js --network mumbai
npx hardhat run scripts/create-sample-todos.js --network mumbai
```

#### Polygon Mainnet Deployment

```bash
yarn deploy:polygon
```

### Contract Verification

```bash
# Verify on Mumbai
yarn verify:mumbai <contract-address>

# Verify on Polygon
yarn verify:polygon <contract-address>
```

## Frontend Integration

### Web3.js Example

```javascript
const Web3 = require('web3');
const TodoListFactoryABI = require('./artifacts/contracts/TodoListFactory.sol/TodoListFactory.json').abi;
const TodoListABI = require('./artifacts/contracts/TodoList.sol/TodoList.json').abi;

// Connect to Polygon
const web3 = new Web3('https://polygon-rpc.com');

// Set up account
const account = web3.eth.accounts.privateKeyToAccount('0xYourPrivateKeyHere');
web3.eth.accounts.wallet.add(account);

// TodoListFactory contract address (from deployment)
const factoryAddress = '0xYourFactoryContractAddress';
const factory = new web3.eth.Contract(TodoListFactoryABI, factoryAddress);

// Get or create TodoList
async function getOrCreateTodoList() {
  let todoListAddress = await factory.methods.getTodoList().call({ from: account.address });

  if (todoListAddress === '0x0000000000000000000000000000000000000000') {
    // Create new TodoList
    await factory.methods.createTodoList().send({ from: account.address });
    todoListAddress = await factory.methods.getTodoList().call({ from: account.address });
  }

  return new web3.eth.Contract(TodoListABI, todoListAddress);
}

// Create a todo
async function createTodo(todoList, title, description, priority) {
  return todoList.methods.createTodo(title, description, priority).send({ from: account.address });
}

// Get all todos
async function getTodos(todoList) {
  return todoList.methods.getTodos().call({ from: account.address });
}

// Toggle todo completion
async function toggleTodoCompletion(todoList, id) {
  return todoList.methods.toggleTodoCompletion(id).send({ from: account.address });
}

// Get todo statistics
async function getTodoStats(todoList) {
  return todoList.methods.getTodoStats().call({ from: account.address });
}
```

### ethers.js Example

```javascript
const { ethers } = require('ethers');
const TodoListFactoryABI = require('./artifacts/contracts/TodoListFactory.sol/TodoListFactory.json').abi;
const TodoListABI = require('./artifacts/contracts/TodoList.sol/TodoList.json').abi;

// Connect to Polygon
const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');

// Set up account
const wallet = new ethers.Wallet('0xYourPrivateKeyHere', provider);

// TodoListFactory contract address (from deployment)
const factoryAddress = '0xYourFactoryContractAddress';
const factory = new ethers.Contract(factoryAddress, TodoListFactoryABI, wallet);

// Get or create TodoList
async function getOrCreateTodoList() {
  let todoListAddress = await factory.getTodoList();

  if (todoListAddress === ethers.constants.AddressZero) {
    // Create new TodoList
    const tx = await factory.createTodoList();
    await tx.wait();
    todoListAddress = await factory.getTodoList();
  }

  return new ethers.Contract(todoListAddress, TodoListABI, wallet);
}

// Create a todo
async function createTodo(todoList, title, description, priority) {
  const tx = await todoList.createTodo(title, description, priority);
  return tx.wait();
}

// Get all todos
async function getTodos(todoList) {
  return todoList.getTodos();
}

// Toggle todo completion
async function toggleTodoCompletion(todoList, id) {
  const tx = await todoList.toggleTodoCompletion(id);
  return tx.wait();
}

// Get todo statistics
async function getTodoStats(todoList) {
  return todoList.getTodoStats();
}
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import TodoListFactoryABI from './artifacts/contracts/TodoListFactory.sol/TodoListFactory.json';
import TodoListABI from './artifacts/contracts/TodoList.sol/TodoList.json';

const TodoApp = () => {
  const [account, setAccount] = useState(null);
  const [todoList, setTodoList] = useState(null);
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, highPriority: 0 });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1); // Medium
  const [loading, setLoading] = useState(false);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Please install MetaMask to use this app');
    }
  };

  // Initialize contracts
  useEffect(() => {
    if (!account) return;

    const init = async () => {
      try {
        setLoading(true);

        // Connect to provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Connect to TodoListFactory
        const factoryAddress = '0xYourFactoryContractAddress'; // Replace with actual address
        const factory = new ethers.Contract(factoryAddress, TodoListFactoryABI.abi, signer);

        // Get or create TodoList
        let todoListAddress = await factory.getTodoList();

        if (todoListAddress === ethers.constants.AddressZero) {
          // Create new TodoList
          const tx = await factory.createTodoList();
          await tx.wait();
          todoListAddress = await factory.getTodoList();
        }

        // Connect to TodoList
        const todoList = new ethers.Contract(todoListAddress, TodoListABI.abi, signer);
        setTodoList(todoList);

        // Load todos and stats
        await loadTodos(todoList);
      } catch (error) {
        console.error('Error initializing contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [account]);

  // Load todos and stats
  const loadTodos = async todoListContract => {
    try {
      setLoading(true);

      const todoList = todoListContract || todoList;
      if (!todoList) return;

      // Get todos
      const todos = await todoList.getTodos();
      setTodos(todos);

      // Get stats
      const stats = await todoList.getTodoStats();
      setStats({
        total: stats.total.toNumber(),
        completed: stats.completed.toNumber(),
        pending: stats.pending.toNumber(),
        highPriority: stats.highPriority.toNumber(),
      });
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create todo
  const handleCreateTodo = async e => {
    e.preventDefault();

    if (!todoList || !title) return;

    try {
      setLoading(true);

      // Create todo
      const tx = await todoList.createTodo(title, description, priority);
      await tx.wait();

      // Reset form
      setTitle('');
      setDescription('');
      setPriority(1);

      // Reload todos
      await loadTodos();
    } catch (error) {
      console.error('Error creating todo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle todo completion
  const handleToggleCompletion = async id => {
    if (!todoList) return;

    try {
      setLoading(true);

      // Toggle completion
      const tx = await todoList.toggleTodoCompletion(id);
      await tx.wait();

      // Reload todos
      await loadTodos();
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete todo
  const handleDeleteTodo = async id => {
    if (!todoList) return;

    try {
      setLoading(true);

      // Delete todo
      const tx = await todoList.deleteTodo(id);
      await tx.wait();

      // Reload todos
      await loadTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render priority as string
  const renderPriority = priority => {
    switch (priority) {
      case 0:
        return 'Low';
      case 1:
        return 'Medium';
      case 2:
        return 'High';
      default:
        return 'Unknown';
    }
  };

  if (!account) {
    return (
      <div className="container">
        <h1>Polygon Todo App</h1>
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Polygon Todo App</h1>
      <p>Connected: {account}</p>

      <div className="stats">
        <h3>Statistics</h3>
        <p>Total: {stats.total}</p>
        <p>Completed: {stats.completed}</p>
        <p>Pending: {stats.pending}</p>
        <p>High Priority: {stats.highPriority}</p>
      </div>

      <form onSubmit={handleCreateTodo}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          maxLength={100}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={500}
        />
        <select value={priority} onChange={e => setPriority(parseInt(e.target.value))}>
          <option value={0}>Low</option>
          <option value={1}>Medium</option>
          <option value={2}>High</option>
        </select>
        <button type="submit" disabled={loading}>
          Add Todo
        </button>
      </form>

      {loading && <p>Loading...</p>}

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id.toString()} className={todo.completed ? 'completed' : ''}>
            <span className={`priority priority-${renderPriority(todo.priority).toLowerCase()}`}>
              {renderPriority(todo.priority)}
            </span>
            <h3>{todo.title}</h3>
            <p>{todo.description}</p>
            <div className="todo-actions">
              <button onClick={() => handleToggleCompletion(todo.id)}>
                {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
              <button onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoApp;
```

## Gas Costs

Approximate gas costs for operations:

- Deploy TodoListFactory: ~1,500,000 gas
- Create TodoList: ~2,000,000 gas
- Create Todo: ~100,000 gas
- Update Todo: ~50,000 gas
- Toggle Todo Completion: ~30,000 gas
- Delete Todo: ~40,000 gas
- Get Todos: 0 gas (read-only)
- Get Todo Stats: 0 gas (read-only)

## Security Considerations

- **Access Control**: Only the owner of a TodoList can modify their todos
- **Input Validation**: Title and description lengths are validated
- **Gas Optimization**: Efficient storage and retrieval of todos
- **Factory Pattern**: Secure deployment and management of TodoList contracts

## License

This project is licensed under the MIT License - see the LICENSE file for details.
