const { ethers } = require('hardhat');
async function main() {
  const TodoList = await ethers.getContractFactory('TodoList');
  const todoList = await TodoList.deploy();
  await todoList.waitForDeployment();
  const [owner, user1] = await ethers.getSigners();
  await todoList.createTodo('Owner Todo', 'Desc', 1);
  await todoList.connect(user1).createTodo('User1 Todo', 'Desc', 1);
  try {
    await todoList.getTodo(2);
    console.log("No revert for owner getting user1's todo!");
  } catch (e) {
    console.log('Owner get user1 todo Error:', e.message);
  }
}
main().catch(console.error);
