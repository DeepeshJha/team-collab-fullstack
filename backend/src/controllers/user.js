
const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'David' }
];

exports.getAllUsers = (req,res) => {
    res.json(users);
}

exports.getUserById = (req, res) => {
    let userId = req.params.id;
    let user = users.find(u => u.id == userId)
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
}

exports.createUser = (req, res) => {
    const { name } = req.body;
    let newUser = { id: users.length + 1, name}
    users.push(newUser);
    res.status(201).json(newUser);
}

exports.deleteUser = (req, res) => {
    let userId = req.params.id;
    let userIndex = users.findIndex(u => u.id == userId);
    if(userIndex !== -1) {
        users.splice(userIndex, 1);
        res.json({ message: 'User deleted successfully' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
}
