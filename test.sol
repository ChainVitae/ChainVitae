pragma solidity ^0.4.17;

contract ChainVitae {

  struct vitae{
      string companyName;
      string positionName;
      string startDate;
      string endDate;
  }

  address public userAddress;
  mapping(address => vitae) public _vitaes;

  function insert (string companyName, string positionName, string startDate, string endDate) public {
    userAddress = msg.sender;
    _vitaes[userAddress] = vitae({
      companyName: companyName;
      positionName: positionName;
      startDate: startDate;
      endDate: endDate;
    })
  }

  function getVitaes() public return(vitae){
    vitae cv = _vitaes[msg.sender];
    return cv;
  }

}
