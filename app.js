/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */
var db = require('./models/database.js');
var express = require('express');
var routes = require('./routes/routes.js');
var app = express();
server = app.listen(8080);
app.use(express.bodyParser());
app.use(express.logger("default"));
app.use(express.cookieParser());
app.use(express.session({
	secret : "This is my secret"
}));

app.set('view engine', 'ejs')
  var path = require('path');
  app.use('/static', express.static(path.join(__dirname, 'public')))
    const io = require("socket.io")(server)
      io.on('connection', (socket) => {
    console.log('New')
    
  
    
    socket.on('joinroom', function(data){
     socket.join(data)
  })
  
      socket.on('new_message', (data) => {
          io.sockets.emit('new_message', {message : data.message, 
            user : data.user, user2: data.user2});
          
          var channel = data.user + "-" + data.user2;
          var channel2 = data.user2 + "-" + data.user;
          console.log("the channel is " + channel);
          
          db.createChat(data.user, channel, data.message, function(info, err) {})
          db.createChat(data.user, channel2, data.message, function(info, err) {})
          
      })
  
  })



app.use('/visualization', express.static(__dirname + "/public",{maxAge:1}));


/*
 * Below we install the routes. The first argument is the URL that we are
 * routing, and the second argument is the handler function that should be
 * invoked when someone opens that URL. Note the difference between app.get and
 * app.post; normal web requests are GETs, but POST is often used when
 * submitting web forms ('method="post"').
 */

app.get('/', routes.main);
app.post('/checklogin', routes.login_check);
app.get('/signup', routes.signup);
app.post('/createaccount', routes.create_account);

app.get('/restaurants', routes.restaurants);

app.post('/addrestaurant', routes.restaurant_add);
app.post('/deleterestaurant', routes.deleteRest);
app.get('/logout', routes.logout);
app.post('/exitlogout', routes.exit_logout);

app.post('/addfriend', routes.add_friend);
app.get('/profile', routes.view_profile);
app.post('/sendmessage', routes.send_message);


app.get('/sendrestaurants', routes.getAllRestaurants);

app.get('/updateprofile', routes.get_update_profile);
app.post('/updatedprofile', routes.update_profile);

app.post('/addcomment', routes.add_comment);
app.post('/addcommentprofile', routes.add_comment_profile);

app.get('/search/:term', routes.search);
app.post('/search', routes.search_page);

app.post('/output', routes.recommendation_data);
app.post('/import', routes.import_data);

app.get('/friendvisualization', routes.visualization);

app.get('/getFriends/:user', routes.visualizationFriends);

app.get('/visualization', function(req, res) {
	res.render('friendvisualizer.ejs');
});

app.post('/startChat', routes.startChat);
app.get('/chatInfo', routes.getChatInfo);


app.post('/addlike', routes.add_like);
app.post('/addlike2', routes.add_like2);

/* Run the server */
console.log('Author: Neha Nayak (nehan)');
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
