pragma solidity ^0.4.18;
contract HashList{

    struct node{
        bytes32 previous;
        uint data;
        bytes32 next;
        bool valid;
    }
    
    mapping(bytes32 => node) records;
    bytes32 head;
    bytes32 tail;
    uint size;
    
    uint[] buf;
    
    function HashList() public{
        head = 0x0;
        tail = 0x0;
        size = 0;
    }
    
    function size() public{
        return size;
    }

    function insert(uint data) public{
        bytes32 hash = keccak256(data);
        require(!records[hash].valid);
        records[hash] = node({
            previous: tail,
            data: data,
            next: 0x0,
            valid: true
        });
        if (head == 0x0 && tail == 0x0){
            head = hash;
        }
        else{
            records[tail].next = hash; 
        }
        tail = hash;
        size++;
    }
    
    function remove(uint data) public{
        bytes32 hash = keccak256(data);
        require(records[hash].valid);
        size--;

        if (head != hash){
            records[records[hash].previous].next = records[hash].next;
        }
        else{
            head = records[hash].next;
        }

        if (tail != hash){
            records[records[hash].next].previous = records[hash].previous;
        }
        else{
            tail = records[hash].previous;
            }
        records[hash].valid = false;
        delete records[hash];
    }
    
    function iterate() public returns (uint[]){
        bytes32 current = head;
        buf.length = 0;
        while(current != 0x0){
            buf.push(records[current].data);
            current = records[current].next;
        }
        return buf;
    }
}
