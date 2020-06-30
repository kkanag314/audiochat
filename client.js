//our username 
var name; 
var connectedUser;
  
//connecting to our signaling server
//var conn = new WebSocket('ws://10.0.0.198:9090');
var conn = new WebSocket('ws://192.168.172.1:9090');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
   
};
function gotStream(myStream)
 { 
		console.log("Got the Stream - manual login");
         stream = myStream; 
		/*if(window.webkitURL === undefined ){
			console.log('window.webkitURL not defined');
			//localAudio.src = stream;
		}
		else	
		{*/
			//displaying local video stream on the page 
			//localVideo.srcObject = stream;
			//localVideo.src = window.webkitURL.createObjectURL(stream);
			//localAudio.src = stream;
			
			try {
					localAudio.srcObject = stream;
					console.log('Assigned to srcObject');
				} 
			catch (error) {
					console.log(error);
					localAudio.src = URL.createObjectURL(mediaSource);
			}
			
			console.log('Local Audio/Video Streaming');
		//}
		
		stream.getTracks().forEach(function(track) {
			console.log('Adding track');
		yourConn.addTrack(track, stream);
		});
		/*if (yourConn.addStream === undefined)
		{
			console.log('add stream not defined');
		}
		else{
		// setup stream listening 
         yourConn.addStream(stream); 
		 			console.log('add stream defined');
		}*/
		
         //when a remote user adds stream to the peer connection, we display it 
         yourConn.ontrack = function (e) { 
            console.log("On  Add track");
			//var c = document.getElementById("myCanvas");
			//var ctx = c.getContext("2d");
			//ctx.fillStyle = "#FF0000";
			//ctx.fillRect(20, 20, 150, 100);
			/*if(window.webkitURL === undefined ){
				//remoteVideo.src = e.stream;
				console.log('window.webkitURL not defined - Remote VIdeo/Audio Stream');
			}
			else
			{*/
				try {
					remoteAudio.srcObject = e.streams[0];
					console.log('Assigned to srcObject');
				} 
				catch (error) {
					console.log(error);
					remoteAudio.src = URL.createObjectURL(stream);
				}	
				//remoteVideo.src = window.URL.createObjectURL(e.stream); 
				//remoteAudio.src = e.streams[0];
				console.log('window.webkitURL defined.. Remote Audio Stream');
			//}
			
         };
}
  
//when we got a message from a signaling server 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);
	
   var data = JSON.parse(msg.data); 
	console.log("Got message", data.type);
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   }
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages 
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   conn.send(JSON.stringify(message)); 
};
  
//****** 
//UI selectors block 
//******
 
var loginPage = document.querySelector('#loginPage'); 
var usernameInput = document.querySelector('#usernameInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var callPage = document.querySelector('#callPage'); 
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn'); 

var hangUpBtn = document.querySelector('#hangUpBtn');
  
var localAudio = document.querySelector('#localAudio'); 
var remoteAudio = document.querySelector('#remoteAudio'); 

var yourConn; 
var stream;
  
callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) { 
   name = usernameInput.value; 
	
   if (name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   } 
	
});
  
function handleLogin(success) { 
   if (success === false) { 
      alert("Ooops...try a different username"); 
   } else { 
      loginPage.style.display = "none"; 
      callPage.style.display = "block";
		
      //********************** 
      //Starting a peer connection 
      //********************** 
		//using Google public stun server 
		//sequence<RTCIceServer> iceServers = [{ "url": "stun:stun2.1.google.com:19302" }];

	var configuration = null/*{ 
			//iceServers;
          "iceServers" :[{ "url": 'stun:stun2.1.google.com:19302' }]
    }; */
	/*		
    if ( typeof(webkitRTCPeerConnection)) !== 'undefined')
	{
		console.log("using webkitRTCPeerConnection");
		yourConn = new webkitRTCPeerConnection(configuration) | new RTCPeerConnection(configuration);
	}
	else
	{		
		console.log("using RTCPeerConnection");
		yourConn = new RTCPeerConnection(configuration);
	}*/
	try{
		yourConn = new webkitRTCPeerConnection(configuration);
		console.log("webkitRTCPeerConnection defined here in the try block");
	}
	catch(exception){
		yourConn =  new RTCPeerConnection(configuration);
		console.log("in exception block");
	}
	console.log("RTC connection good");	
	 
	 //getting local video stream 
      navigator.mediaDevices.getUserMedia({ audio: true })
	  .then(gotStream)
	  .catch(function (err) { 
	   console.log(err.name + ": " + err.message);
         /*console.log("Auto login");
			send({ 
				type: "login", 
				name: "stb"
			}); */		 
      }); 
	 
	 // Setup ice handling 
         yourConn.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };  
     
	 
		
   } 
};
  
//initiating a call 
callBtn.addEventListener("click", function () { 
   var callToUsername = callToUsernameInput.value;
	
   if (callToUsername.length > 0) { 
	
      connectedUser = callToUsername;
		
      // create an offer 
      yourConn.createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
		console.log(offer);
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      });
		
   } 
});
  
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   connectedUser = name; 
   yourConn.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
};
 
//when we got an answer from a remote user
function handleAnswer(answer) { 
   yourConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function handleCandidate(candidate) { 
   yourConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};
   
//hang up 
hangUpBtn.addEventListener("click", function () { 

   send({ 
      type: "leave" 
   });  
	
   handleLeave(); 
});
  
function handleLeave() { 
   connectedUser = null; 
   remoteAudio.srcObject = null; 
	
   yourConn.close(); 
   yourConn.onicecandidate = null; 
   yourConn.onaddstream = null; 
};