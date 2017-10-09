pragma solidity ^0.4.17;

contract HashList{
    
    struct node{
        bytes32 previous;
        bytes32 hash;
        bytes32 next;
        bool valid;
    }
    
    mapping(bytes32 => node) records;
    function getRecord(bytes32 hash) public constant returns (bytes32){
        return records[hash].hash;
    }
    function getNext(bytes32 hash) public constant returns (bytes32){
        return records[hash].next;
    }
    function getPrevious(bytes32 hash) public constant returns (bytes32){
        return records[hash].previous;
    }
    bytes32 head;
    function getHead() public constant returns (bytes32){
        return head;
    }
    bytes32 tail;
    function getTail() public constant returns (bytes32){
        return tail;
    }
    uint _size;
    function size() public constant returns (uint){
        return _size;
    }
    
    function insert(bytes32 hash) public{
        require(!records[hash].valid);
        records[hash] = node({
            previous: tail,
            hash: hash,
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
        _size++;
    }
    
    function remove(bytes32 hash) public{
        require(records[hash].valid);
        _size--;

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
    
    bytes32[] arr;
    function iter() public returns (bytes32[]){
        arr.length = 0;
        bytes32 current = head;
        while (current != 0x0){
            arr.push(records[current].hash);
            current = records[current].next;
        }
        return arr;
    }
}

contract ChainVitae{

    struct date{
        uint8 day;
        uint8 month;
        uint year;
    }

    struct vitae{
        string institutionName;
        string employeeName;
        address employee;
        string positionName;
        date startDate;
        date endDate;
    }

    mapping(address => address) vitaes;
    mapping(address => address) pending;
    mapping(address => address) requests;
    
    mapping(address => string) employee;
    mapping(string => address) institution;
    mapping(bytes32 => vitae) _vitaes;

    function request(string institutionName, string positionName, uint8 startDay, uint8 startMonth, uint startYear, uint8 endDay, uint8 endMonth, uint endYear) public returns(bytes32){
        require(isEmployee());
        require(institution[institutionName] != 0);
        require(endYear >= startYear);
        if (endYear == startYear){
            require(endMonth >= startMonth);
            if (endMonth == startMonth){
                require(endDay >= startDay);
            }
        }
        bytes32 hash = keccak256(
            institutionName,
            institution[institutionName],
            employee[msg.sender],
            msg.sender,
            positionName,
            startDay,
            startMonth,
            startYear,
            endDay,
            endMonth,
            endYear);
            
        _vitaes[hash] = vitae({
            institutionName: institutionName,
            employeeName: employee[msg.sender],
            employee: msg.sender,
            positionName: positionName, 
            startDate: date({
                day: startDay,
                month: startMonth,
                year: startYear
            }), 
            endDate: date({
                day: endDay,
                month: endMonth,
                year: endYear
            })
        });
        HashList(pending[msg.sender]).insert(hash);
        HashList(requests[institution[institutionName]]).insert(hash);
        return hash;
    }
    
    function endorse(bytes32 hash) public{
        require(institution[_vitaes[hash].institutionName] == msg.sender);
        address employee = _vitaes[hash].employee;
        HashList(pending[employee]).remove(hash);
        HashList(requests[msg.sender]).remove(hash);
        HashList(vitaes[employee]).insert(hash);
    }
    
    function registerEmployee(string employeeName) public returns (address){
        require(!isEmployee());
        require(institution[employeeName] == 0x0);
        employee[msg.sender] = employeeName;
        pending[msg.sender] = new HashList();
        vitaes[msg.sender] = new HashList();
        return pending[msg.sender];
    }
    
    function isEmployee() public returns (bool){
        return (isEmployee(msg.sender));
    }
    
    function isEmployee(address addr) public returns (bool){
        return (keccak256(employee[addr]) != keccak256(""));
    }
    
    function registerInstitution(string institutionName) public{
        require(keccak256(employee[msg.sender]) == keccak256(""));
        require(institution[institutionName] == 0);
        institution[institutionName] = msg.sender;
        requests[msg.sender] = new HashList();
    }
    
    function isInstitution() public returns (bool){
        return (isInstitution(msg.sender));
    }
    
    function isInstitution(address addr) public returns (bool){
        return (true);
    }
    
    bytes32[] arr;
    function getPending() public returns (bytes32[]){
        require(isEmployee());
        arr.length = 0;
        bytes32 current = HashList(pending[msg.sender]).getHead();
        while(current != 0x0){
            arr.push(HashList(pending[msg.sender]).getRecord(current));
            current = HashList(pending[msg.sender]).getNext(current);
        }
        return arr;
    }
    
    function getRequests() public returns (bytes32[]){
        require(isInstitution());
        arr.length = 0;
        bytes32 current = HashList(requests[msg.sender]).getHead();
        while(current != 0x0){
            arr.push(HashList(requests[msg.sender]).getRecord(current));
            current = HashList(requests[msg.sender]).getNext(current);
        }
        return arr;
    }
    
    function getVitaes() public returns (bytes32[]){
        require(isEmployee());
        arr.length = 0;
        bytes32 current = HashList(vitaes[msg.sender]).getHead();
        while (current != 0x0){
            arr.push(HashList(vitaes[msg.sender]).getRecord(current));
            current = HashList(vitaes[msg.sender]).getNext(current);
        }
        return arr;
    }
}
