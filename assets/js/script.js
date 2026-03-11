var tasks = [];
let taskIdCounter = 0;
let draggedElement = null;

let titleInput;
let descriptionInput;
let addTaskButton;
let deleteTaskButton;
let toDoColumn;
let statusColumns;

    function dragStartHandler(event) {
        draggedElement = event.target;
        event.dataTransfer.effectAllowed = "move";
    }

    function dragOverHandler(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    function dropHandler(event) {
        event.preventDefault();
        
        if (!draggedElement) return;

        // Find the closest task-status column (in case we dropped on a child element)
        let dropTarget = event.target;
        while (dropTarget && !dropTarget.classList.contains("task-status")) {
            dropTarget = dropTarget.parentElement;
        }

        if (dropTarget && dropTarget.classList.contains("task-status")) {
            dropTarget.appendChild(draggedElement);

            const newStatus = dropTarget.id;
            draggedElement.status = newStatus;

            // Keep the task's status metadata in the DOM up-to-date.
            const taskStatusData = draggedElement.querySelector("data");
            if (taskStatusData) {
                taskStatusData.setAttribute("status", newStatus);
            }

            const movedTaskIndex = tasks.findIndex((task) => task.title === draggedElement.querySelector("h3").textContent);
            if (movedTaskIndex > -1) {
                tasks[movedTaskIndex].status = newStatus;
            }

            localStorage.setItem("task", JSON.stringify(tasks));
            console.log(tasks);
        }

        draggedElement = null;
    }

    // Support enter pressing to add a task for better user experience
    const handleEnterToAdd = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const title = titleInput ? titleInput.value.trim() : "";
            const description = descriptionInput ? descriptionInput.value.trim() : "";
            addTask(title, description);
        }
    };

    const addTask = (title, description, status = "to-do", shouldPersist = true, shouldClearInputs = true) => {

        if (!title) {
            alert("Please enter a task title.");
            titleInput.focus();
            return;
        }

        // Create the task object
        const newTask = {
            title: title,
            description: description,
            status: status
        };
        tasks.push(newTask);

        // Create a new HTML Element with the task attributes
        const taskElement = document.createElement("div");

        // Make the new task element draggable to support existing drag and drop functionality for hardcoded data
        taskElement.setAttribute("draggable", "true");
        taskElement.className = "task-item";
        taskElement.id = "task-" + (++taskIdCounter);

        const taskTitle = document.createElement("h3");
        taskTitle.textContent = title;

        const taskDescription = document.createElement("p");
        taskDescription.textContent = description;

        const taskDeleteButton = document.createElement("button");
        taskDeleteButton.textContent = "X";
        taskDeleteButton.className = "delete-task";
        taskDeleteButton.id = "delete-task-btn";

        const taskStatusData = document.createElement("data");
        taskStatusData.setAttribute("status", status);

        // Append the title and description to the task element, and then append the task element to the "To Do" column
        taskElement.appendChild(taskTitle);
        taskElement.appendChild(taskDescription);
        taskElement.appendChild(taskStatusData);
        taskElement.appendChild(taskDeleteButton);

        const targetColumn = document.getElementById(status) || toDoColumn;
        targetColumn.appendChild(taskElement);

        // Clear the input fields and set focus back to the title input for convenience
        if (shouldClearInputs) {
            titleInput.value = "";
            descriptionInput.value = "";
            titleInput.focus();
        }

        // Add drag listener to the newly created task
        taskElement.addEventListener("dragstart", dragStartHandler);

        // Add delete functionality to the new task's delete button
        taskDeleteButton.addEventListener("click", () => {
            taskElement.remove();
            tasks.splice(tasks.findIndex((task) => task.title === title && task.description === description && task.status === status), 1);
            localStorage.setItem("task", JSON.stringify(tasks));
        });

        // Save the new task to localStorage
        if (shouldPersist) {
            localStorage.setItem("task", JSON.stringify(tasks));
        }

        return taskElement;
    };

addEventListener("DOMContentLoaded", () => {

    titleInput = document.getElementById("task-title");
    descriptionInput = document.getElementById("task-description");
    addTaskButton = document.getElementById("add-task-btn");
    deleteTaskButton = document.querySelectorAll("#delete-task-btn");
    toDoColumn = document.getElementById("to-do");
    statusColumns = document.querySelectorAll(".task-status");

    // Load tasks from localStorage if available
    const storedTasks = JSON.parse(localStorage.getItem("task"));
    if (Array.isArray(storedTasks)) {
        tasks = [];
        console.log(storedTasks);

    // For existing tasks, make them draggable, prefill their status from the data attribute, add drag listeners, and prefill tasks array with hardcoded data
    // const existingTasks = document.querySelectorAll(".task-item");
    storedTasks.forEach((task) => {
        // task.title = task.querySelector("h3").textContent;
        // task.description = task.querySelector("p").textContent;
        // task.status = task.querySelector("data") ? task.querySelector("data").getAttribute("status") : "to-do";
        // tasks.push({
        //     title: task.title,
        //     description: task.description,
        //     status: task.status
        // });
        var taskElement = addTask(task.title, task.description, task.status || "to-do", false, false);
        taskElement.setAttribute("draggable", "true");
        taskElement.addEventListener("dragstart", dragStartHandler);
    });

    // Normalize storage once after hydration.
    localStorage.setItem("task", JSON.stringify(tasks));
    }
    

    // Set up drag-and-drop listeners on columns (only once)
    statusColumns.forEach((column) => {
        column.addEventListener("dragover", dragOverHandler);   
        column.addEventListener("drop", dropHandler);
    });
    
    // Inline HTML event handlers causes functionality to fail, call the function through here with an event listener.
    addTaskButton.addEventListener("click", addTaskToBoard);

    function addTaskToBoard() {
        // The parameters of the task taken from the input fields
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        addTask(title, description);
    }

    // For existing tasks, add delete functionality
    deleteTaskButton.forEach((button) => {
        button.addEventListener("click", (event) => {
            const taskItem = event.target.closest(".task-item");
            if (taskItem) {
                taskItem.remove();
            }
        });
    });

    titleInput.addEventListener("keydown", handleEnterToAdd);
    descriptionInput.addEventListener("keydown", handleEnterToAdd);
});