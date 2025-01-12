const http = require('http');
const express = require('express');
const path = require('path');
const { Server } = require('socket.io'); // Fixing the imports

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};

app.use(express.static(path.resolve('./public')))
// Serve the HTML file
app.get('/', (req, res) => {
    return res.sendFile('/public/index.html');
});

// Socket connection event
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);


    socket.on("register", (username) => {
        users[username] = socket.id; // Map username to the socket ID
        console.log(`User registered: ${username} (${socket.id})`);
    });

    socket.on("private_message", ({ sender, recipient, message }) => {
        const recipientSocketId = users[recipient];

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("private_message", { sender, message });
            console.log(`Message from ${sender} to ${recipient}: ${message}`);
        } else {
            console.log(`User ${recipient} is not online.`);
            socket.emit("error", `User ${recipient} is not online.`);
        }
    });


    // Example: Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        for (const username in users) {
            if (users[username] === socket.id) {
                delete users[username];
                console.log(`User ${username} has been removed.`);
                break;
            }
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
