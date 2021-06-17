const express = require("express");
const http = require("http");
require("dotenv").config();
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "../public");

app.use(express.static(publicDir));

app.get("", (req, res) => {
	res.sendFile("index.html");
});

io.on("connection", (socket) => {
	console.log("new connection");

	socket.on("join", (options, callback) => {
		const { error, user } = addUser({ id: socket.id, ...options });

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit("message", generateMessage("Welcome", user.username));
		socket.broadcast
			.to(user.room)
			.emit(
				"message",
				generateMessage(
					`${user.username} has joined!`,
					user.username
				)
			);
		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(),
		});

		callback();
	});

	socket.on("sendMessage", (msg, callback) => {
		const user = getUser(socket.id);
		const filter = new Filter();

		if (filter.isProfane(msg)) {
			return callback("profanity is not allowed");
		}
		io.to(user.room).emit("message", generateMessage(msg, user.username));
		callback();
	});

	socket.on("sendLocation", ({ lat, long }, callback) => {
		const user = getUser(socket.id);

		io.to(user.room).emit(
			"locationMessage",
			`https://google.com/maps?q=${lat},${long}`
		);
		callback();
	});

	socket.on("disconnect", () => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit(
				"message",
				generateMessage(
					`${user.username} has left`
				)
			);

			io.to(user.room).emit("roomData", {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

server.listen(port, () => {
	console.log(`server is up on port ${port}`);
});
