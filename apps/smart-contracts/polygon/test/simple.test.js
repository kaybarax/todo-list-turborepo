const { expect } = require('chai');
const hre = require('hardhat');

describe('Simple Base Contract Test', function () {
  it('Should deploy TodoList contract', async function () {
    const TodoList = await hre.ethers.getContractFactory('TodoList');
    const todoList = await TodoList.deploy();
    await todoList.waitForDeployment();

    const address = await todoList.getAddress();
    expect(address).to.not.equal(hre.ethers.ZeroAddress);
  });

  it('Should deploy TodoListFactory contract', async function () {
    const TodoListFactory = await hre.ethers.getContractFactory('TodoListFactory');
    const factory = await TodoListFactory.deploy();
    await factory.waitForDeployment();

    const address = await factory.getAddress();
    expect(address).to.not.equal(hre.ethers.ZeroAddress);
  });
});
