// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

contract CandyShop {
    enum CandyTypes {
        Vanilla,
        Chocolate,
        Strawberry
    }
    uint candiesSold=0;
    uint numCandies=3;
    uint candyCost=0.1 ether; //0.1 Ether

    CandyTypes candyTypes;

    event CandyBought(address indexed _from, uint _type);

    function buyCandy(uint _candyType) public payable returns(CandyTypes) {
        require(msg.value==candyCost, 'Price of 1 candy is 0.1 ether');
        require(_candyType<3, 'Candies come in only 3 varities');

        emit CandyBought(msg.sender, _candyType);
        candyTypes=CandyTypes(_candyType);
        candiesSold++;
        return candyTypes;
    }

    function getCandyCost() public view returns(uint) {
        return candyCost;
    }

    function getNumberOfCandyTypes() public view returns(uint) {
        return numCandies;
    }

    function getCandiesSold() public view returns(uint) {
        return candiesSold;
    }
}