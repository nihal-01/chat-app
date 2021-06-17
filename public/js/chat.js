const socket = io();

const form = document.querySelector("form");
const input = document.querySelector("#message");
const messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// oPtions
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

socket.on("message", (response) => {
	console.log(response);

	const html = Mustache.render(messageTemplate, {
		text: response.text,
		username: response.username,
		createdAt: moment(response.createdAt).format("h:mm a"),
	});
	messages.insertAdjacentHTML("beforeend", html);
});

socket.on("locationMessage", (url) => {
	console.log(url);

	const html = Mustache.render(locationTemplate, {
		url,
	});

	messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users }) => {
	console.log(users);
	const html = Mustache.render(sidebarTemplate, {
		room,
		users,
	});
	document.querySelector("#sidebar").innerHTML = html;
});

form.onsubmit = (event) => {
	event.preventDefault();

	socket.emit("sendMessage", input.value, (error) => {
		if (error) {
			return console.log(error);
		}
		input.value = "";
		console.log("Message delivered");
	});
};

document.querySelector("#send-location").addEventListener("click", () => {
	if (!navigator.geolocation) {
		return alert("Geo location is not supported by your browser");
	}

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			"sendLocation",
			{
				lat: position.coords.latitude,
				long: position.coords.longitude,
			},
			() => {
				console.log("Location shared");
			}
		);
	});
});

socket.emit("join", { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = "/";
	}
});
