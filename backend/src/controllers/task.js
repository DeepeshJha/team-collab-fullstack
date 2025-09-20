const tasks = [
  { id: 1, title: "Task 1", description: "Description for Task 1" },
  { id: 2, title: "Task 2", description: "Description for Task 2" },
  { id: 3, title: "Task 3", description: "Description for Task 3" }
];

exports.getAllTasks = (req, res) => {
    res.json(tasks);
}

exports.getTaskById = (req, res) => {
    let index = req.params.id;
    let task = tasks.find(t => t.id == index);
    if(task) {
        res.json(task);
    } else {
        res.status(404).json({ message: `Task with id ${index} not found`})
    }
}

exports.createTask = (req, res) => {
    const { title, description } = req.body;
    let newTask = { id: tasks.length + 1, title, description };
    tasks.push(newTask);
    res.status(201).json(newTask);
}

exports.deleteTask = (req, res) => {
    let index = req.params.id;
    let taskIndex = tasks.findIndex(t => t.id == index);
    if(taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        res.json({ message: `Task with id ${index} deleted successfully` });
    } else {
        res.status(404).json({ message: `Task with id ${index} not found` });
    }
}