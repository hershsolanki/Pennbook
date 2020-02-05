var db = require('../models/database.js');
var async = require('async');

// main log in page
var getMain = function(req, res) {
	res.render('login.ejs', {
		message : null
	});
};

// sign up page
var toSignup = function(req, res) {
	res.render('create.ejs', {
		message : null
	});
};

// log out will redirect you, and set user to no longer active
var toLogout = function(req, res) {
	var username = req.session.user;
	//get user info to update their online/offline status as offline in the database
	db.getUserInfo(username, function(info1, err) {
		var data = JSON.stringify(info1);
		var parseData = JSON.parse(data);
		var userInfo = JSON.parse(parseData[0].value);

		var firstname = userInfo.firstname;
		var lastname = userInfo.lastname;
		var email = userInfo.email;
		var affiliation = userInfo.affiliation;
		var interests = userInfo.interests;
		var birthday = userInfo.birthday;
		var status = userInfo.status;
		var active = false;

		db.updateProfile(username, firstname, lastname, email, affiliation, interests, birthday, status, active, function(data, err) {});

		req.session.user = null;
		res.render('login.ejs', {
			message : null
		});
	});
};

// log out if you exit the browser
var exit_logout = function(req, res) {
	console.log("THE USER EXITED THE BROWSER");
	var username = req.session.user;
	db.getUserInfo(username, function(info1, err) {
		var data = JSON.stringify(info1);
		var parseData = JSON.parse(data);
		var userInfo = JSON.parse(parseData[0].value);

		var firstname = userInfo.firstname;
		var lastname = userInfo.lastname;
		var email = userInfo.email;
		var affiliation = userInfo.affiliation;
		var interests = userInfo.interests;
		var birthday = userInfo.birthday;
		var status = userInfo.status;
		var active = false;

		db.updateProfile(username, firstname, lastname, email, affiliation, interests, birthday, status, active, function(data, err) {
			req.session.user = null;
		});
	});
};

//ADD A LIKE FUNCTION ADDED
var add_like = function(req, res) {
	var username = req.session.user;
	var postID = req.body.postID;
	var receiver = req.body.username;	
	
			db.myDB_getPost(postID, function(info) {
				var chat = null;
				
				if (info != null) {
					var parse = JSON.parse(info);
					user = parse.user;
					comment = parse.comment;
					liker = parse.liker;
					
					
					var likeArray = liker.split('\t');
					
					if (likeArray.includes(username)) {
						res.send("Already liked - go back")
					} else {
						
						receiver =  receiver.slice(0, -1);
						console.log("The reciver is " + receiver);
							db.createLike(username, postID, function(info, err) {
								res.redirect('/profile/?user=' + receiver);
							});

					}		
					
				}


		});
	
};

//ADD A LIKE FUNCTION ADDED
var add_like2 = function(req, res) {
	var username = req.session.user;
	var postID = req.body.postID;
	
	console.log("The user is " + username);
	
			db.myDB_getPost(postID, function(info) {
				var chat = null;
				
				if (info != null) {
					var parse = JSON.parse(info);
					user = parse.user;
					comment = parse.comment;
					liker = parse.liker;
					
					
					var likeArray = liker.split('\t');
					
					if (likeArray.includes(username)) {
						res.send("Already liked - go back")
					} else {
							db.createLike(username, postID, function(info, err) {
								res.redirect("restaurants");
							});
					}		
					
				}
		});
	
};

// check credentials
var loginCheck = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	db.lookup(username, password, function(data, err) {
		// message based on error
		if (err) {
			res.render('login.ejs', {
				message : "Missing information"
			});
		} else if (data == "yes") {
			//get user info to update their online/offline status as online in the database
			db.getUserInfo(username, function(info1, err) {
				var data = JSON.stringify(info1);
				var parseData = JSON.parse(data);
				var userInfo = JSON.parse(parseData[0].value);

				var firstname = userInfo.firstname;
				var lastname = userInfo.lastname;
				var email = userInfo.email;
				var affiliation = userInfo.affiliation;
				var interests = userInfo.interests;
				var birthday = userInfo.birthday;
				var status = userInfo.status;
				var active = true;

				db.updateProfile(username, firstname, lastname, email, affiliation, interests, birthday, status, active, function(data, err) {
					req.session.user = username;
					req.session.save();
					res.redirect('/restaurants');
				});
			});
		} else if (data == "no") {
			res.render('login.ejs', {
				message : "Password Incorrect"
			});
		} else {
			res.render('login.ejs', {
				message : "Username not found"
			});
		}
	});
};

// fill out create account form
var createAccount = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	var email = req.body.email;
	var affiliation = req.body.affiliation;
	var interests = req.body.interests;
	var birthday = req.body.birthday;
	var status = "Hi! I just joined Fakebook.";
	var active = true;

	var checkIncomplete = username.lenth === 0 || password.length === 0
			|| firstname.length === 0 || lastname.length === 0 
			|| email.length === 0 || affiliation.length === 0 
			|| interests.length === 0 || birthday.length === 0;

	db.createAccount(username, password, firstname, lastname, email,
		affiliation, interests, birthday, status, active, function(data, err) {
		if (checkIncomplete) {
			res.render('create.ejs', {
				message : "Please complete all forms"
			});
		} else if (err) {
			res.render('create.ejs', {
				message : err
			});
		} else if (data) {
			req.session.user = username;
			req.session.save();
			res.redirect('/restaurants');
		} else {
			res.render('create.ejs', {
				message : "Try again"
			});
		}
	});
};

// show restaurants data
var restaurants = function(req, res) {
	if (req.session.user) {
		//get all posts from database
		db.myDB_getPosts(function(info) {
			//get user's friends to display which ones are online/offline on homepage
			db.getOnlineFriends(req.session.user, function(info2) {
				var online = [];
				var offline = [];
				var posts = null;
				var comments = null;
				if (info2 != null) {
					var data = JSON.stringify(info2);
					var parseData = JSON.parse(data);
					online = parseData.online;
					offline = parseData.offline;
				}
				if (info != null) {
					var parse = JSON.parse(info);
					posts = parse.posts;
					comments = parse.comments;
				}
				res.render('restaurants.ejs', {
					posts : posts,
					comments: comments,
					user: req.session.user,
					online: online,
					offline: offline
				});
			});
		});
	} else {
		res.redirect('/');
	}
};

// just send the restaurant data for markers
var getAllRestaurants = function(req, res) {
	
	db.myDB_getPosts(function(info) {
		var user = req.session.user;
		res.send({
			user : user,
			info : info
		});
	});
};

// delete a restaurant
var deleteRest = function(req, res) {
	var name = req.body.name;
	db.deleteRestaurant(name, function(data, err) {
		if (err) {
			res.send("error");
		} else if (data === "error") {
			res.send("no");
		} else {
			res.json("good");
		}
	});
};

// update status; update status in database and create a updated status post
var addRestaurant = function(req, res) {
	var username = req.session.user;
	var post = req.body.post;
	var where = req.session.user;
	var postlen = post.length === 0;

	var notComplete = postlen;
	var date = new Date();
	var timestamp = JSON.stringify(date.getTime());

	//get user info to update their current status in the database
	db.getUserInfo(username, function(info1, err) {
		var data = JSON.stringify(info1);
		var parseData = JSON.parse(data);
		var userInfo = JSON.parse(parseData[0].value);

		var firstname = userInfo.firstname;
		var lastname = userInfo.lastname;
		var email = userInfo.email;
		var affiliation = userInfo.affiliation;
		var interests = userInfo.interests;
		var birthday = userInfo.birthday;
		var status = post;
		var active = true;

		if (!notComplete) {
			db.updateProfile(username, firstname, lastname, email, affiliation, interests, birthday, status, active, function(data, err) {
				var date = new Date();
				var timestamp = JSON.stringify(date.getTime());
				db.createPost(username, timestamp, post, username, function(data, err) {
					res.redirect('/restaurants');
				});
			});
		} else {
			res.redirect('/restaurants');
		}
	});
};

// add a comment to the database
var add_comment = function(req, res) {
	var username = req.session.user;
	var postID = req.body.postID;
	var comment = req.body.comment;
	var length = comment.length === 0;
	var notComplete = length;

	if(!notComplete) {
		db.createComment(username, postID, comment, function(info, err) {
			res.redirect('/restaurants');
		});
	}
};

// add a comment to the database
var add_comment_profile = function(req, res) {
	var user = req.query.user;
	var username = req.session.user;
	var postID = req.body.postID;
	var comment = req.body.comment;
	var length = comment.length === 0;
	var notComplete = length;

	if(!notComplete) {
		db.createComment(username, postID, comment, function(info, err) {
			res.redirect('/profile/?user=' + user);
		});
	}
};

// get profile information from clicked username
var view_profile = function(req, res) {
	if (req.session.user) {
		var user = req.query.user;

		//get user's info
		db.getUserInfo(user, function(info1, err) {
			var data = JSON.stringify(info1);
			var parseData = JSON.parse(data);
			var userInfo = JSON.parse(parseData[0].value);

			var firstname = userInfo.firstname;
			var lastname = userInfo.lastname;
			var email = userInfo.email;
			var affiliation = userInfo.affiliation;
			var interests = userInfo.interests;
			var birthday = userInfo.birthday;
			var status = userInfo.status;
			var posts = [];
			var active = userInfo.active;
			var friendsList = [];

			//get posts relevant to user
			db.getProfilePosts(user, function(info) {
				posts = [];
				comments = [];
				if (info != null) {
					var parse = JSON.parse(info);
					posts = parse.posts;
					comments = parse.comments;
				}

				//get list of user's friends and check to see if current user is friends with this user
				var isFriend = false;
				db.getFriends(user, function(info2) {
					if (info2 != null) {
						var data = JSON.stringify(info2);
						var parseData = JSON.parse(data);
						var friends = JSON.parse(parseData[0].value);
						var friendsTab = friends.friends;
						friendsList = friendsTab.split("\t");
						if (friendsList.includes(req.session.user)) {
							isFriend = true;
						}
					}

					//display the user's profile and send relevant info to render this page
					res.render('profile.ejs', {
						username : user,
						firstname : firstname,
						lastname : lastname,
						email : email,
						affiliation : affiliation,
						interests : interests,
						birthday : birthday,
						posts: posts,
						comments: comments,
						currentUser: req.session.user,
						isFriend: isFriend,
						friends: friendsList,
						status: status,
						active: active
					});
				});
			});
		});
	} else {
		res.redirect('/');
	}
};

// add a user as a friend (friendships are not directed)
var add_friend = function(req, res) {
	var receiver = req.body.username;
	var requester = req.session.user;
	
	db.addFriend(receiver, requester, function(info, err) {});
	db.addFriend(requester, receiver, function(info, err) {});
	db.createChatChannel(receiver, requester, function(info, err) {});

	// create posts announcing the two users have become friends
	var receiverPost = "became friends with " + JSON.stringify(requester);
	var requesterPost = "became friends with " + JSON.stringify(receiver);
	var receiverWhere = receiver;
	var requesterWhere = requester;
	var date = new Date();
	var timestamp = JSON.stringify(date.getTime());
	var timestamp2 = JSON.stringify(date.getTime()+1);

	db.createPost(receiver, timestamp, receiverPost, receiver, function(data, err) {});
	db.createPost(requester, timestamp2, requesterPost, requester, function(data, err) {
		res.redirect('/profile/?user=' + receiver);
	});

};

// post a public message on a friend's wall
var send_message = function(req, res) {
	var name = req.session.user;
	var message = req.body.message;
	var where = req.body.username;
	var postlen = message.length === 0;

	var notComplete = postlen;
	var date = new Date();
	var timestamp = JSON.stringify(date.getTime());

	//only post public message if input field is not empty
	db.createPost(name, timestamp, message, where, function(data, err) {
		if (!notComplete) {
			res.redirect('/profile/?user=' + where);
		}
	});
};

//display update profile page with user's current info
var get_update_profile = function(req, res) {
	if (req.session.user) {
		var user = req.session.user;
		db.getUserInfo(user, function(info1, err) {
			var data = JSON.stringify(info1);
			var parseData = JSON.parse(data);
			var userInfo = JSON.parse(parseData[0].value);

			var firstname = userInfo.firstname;
			var lastname = userInfo.lastname;
			var email = userInfo.email;
			var affiliation = userInfo.affiliation;
			var interests = userInfo.interests;
			var birthday = userInfo.birthday;
			var status = userInfo.status;

			res.render('updateprofile.ejs', {
				username: user,
				firstname: firstname,
				lastname: lastname,
				email: email,
				affiliation: affiliation,
				interests: interests,
				birthday: birthday,
				status: status,
				message: null
			});
		});
	} else {
		res.redirect('/');
	}
};

// actually update the profile
var update_profile = function(req, res) {
	if (req.session.user) {
		var username = req.session.user;
		var firstname = req.body.firstname;
		var lastname = req.body.lastname;
		var email = req.body.email;
		var affiliation = req.body.affiliation;
		var interests = req.body.interests;
		var birthday = req.body.birthday;
		var active = true;

		var checkIncomplete = firstname.length === 0 || lastname.length === 0 
				|| email.length === 0 || affiliation.length === 0 
				|| interests.length === 0 || birthday.length === 0;
		var noChanges = false;
		var post = "";

		// check to see that new inputs are different from old info
		// if the user didn't actually change any of their info, don't go through with the update
		// if the user changed one or more fields, create a post to announce this profile change
		if (firstname != req.body.ogfirstname || lastname != req.body.oglastname) {
			post += "Changed their name to " + firstname + " " + lastname + ". ";
		} if (email != req.body.ogemail) {
			post += "Changed their email to " + email + ". ";
		} if (affiliation != req.body.ogaffiliation) {
			post += "Changed their affiliation to " + affiliation + ". ";
		} if (interests != req.body.oginterests) {
			post += "Changed their interests to " + interests + ". ";
		} if (birthday != req.body.ogbirthday) {
			post += "Changed their birthday to " + birthday + ". ";
		} if (firstname === req.body.ogfirstname && lastname == req.body.oglastname && email === req.body.ogemail
			&& affiliation === req.body.ogaffiliation && interests === req.body.oginterests && birthday === req.body.ogbirthday) {
			noChanges = true;
		}

		if (checkIncomplete) {
			res.render('updateprofile.ejs', {
				message : "Please complete all forms",
				firstname: firstname,
				lastname: lastname,
				email: email,
				affiliation: affiliation,
				interests: interests,
				birthday: birthday,
				status: req.body.status,
				active: active
			});
		} else if (!noChanges) {
			db.updateProfile(username, firstname, lastname, email,
				affiliation, interests, birthday, req.body.status, active, function(data, err) {
				if (err) {
					res.render('updateprofile.ejs', {
						message : err
					});
				} else if (data) {
					var date = new Date();
					var timestamp = JSON.stringify(date.getTime());
					db.createPost(username, timestamp, post, username, function(data, err) {});
					res.redirect('/profile/?user='+username);
				}
			});
		} else {
			res.redirect('/profile/?user='+username);
		}
	} else {
		res.redirect('/');
	}
};

//retrieve list of all users and check to see if they start with the search term, send as XML for search suggestions
var search = function(req, res) {
	var searchTerm = req.params.term;
	db.search(function(data, err) {
		var users = null;
		res.type('text/xml');
		var response = "<?xml version=\"1.0\"?>\n<root>\n";
		if (data != null) {
			var parse = JSON.parse(data);
			users = parse.users;

			for (var i = 0; i < users.length; i++) {
				if (users[i].substring(0, searchTerm.length) == req.params.term) {
					response = response + "<element>"+users[i]+"</element>\n";
				}
			}
		}
		response = response + "</root>";
		res.send(response);
	});
};

//render the search page for given query
var search_page = function(req, res) {
	db.search(function(data, err) {
		var users = null;
		var contains = [];
		var returned = [];

		if (data != null) {
			var parse = JSON.parse(data);
			users = parse.users;

			//get all users that contain search term
			for (var i = 0; i < users.length; i++) {
				if (users[i].includes(req.body.searchTerm)) {
					contains.push(users[i]);
				}
			}

			//show users whose prefix is the search term first
			for (var i = 0; i < contains.length; i++) {
				if (contains[i].substring(0, req.body.searchTerm.length) == req.body.searchTerm) {
					returned.push(contains[i]);
				}
			}

			//return rest of search terms
			for (var i = 0; i < contains.length; i++) {
				if (contains[i].substring(0, req.body.searchTerm.length) != req.body.searchTerm) {
					returned.push(contains[i]);
				}
			}
		}

		res.render('search.ejs', {
			list: returned,
			currentUser: req.session.user,
			term: req.body.searchTerm
		});
	});
};

var visualizationFriends = function(req, res) {
	var center = req.params.user;
	var json = '{"id" : "' + center + '","name":"' + center + '","children":[';
	db.getAffiliatedFriends(req.session.user, center, function(info, err) {
		var friendsList = [];
		if (info != null) {
			var parseData = JSON.parse(info);
			friendsList = parseData.friends;

			if (friendsList != undefined || friendsList.length != 0) {
				for (var i = 0; i < friendsList.length; i++) {
					json += '{';
					json += '"id": "' + friendsList[i] + '",';
					json += '"name": "' + friendsList[i] + '",';
					json += '"data": {},';

					if (i != friendsList.length -1) {
						json += '"children": []}, ';
					} else {
						json += '"children": []}';
					}
				}	
			}

			json += '],"data": []}';
			console.log(center + " " + json);
			res.send(json);
		}
	});
}

var show_visualization = function(req, res) {
	res.render('friendvisualizer.ejs');
}


var visualizationJson = function(req, res) {
	var center = req.session.user;
	var json = '{"id" : "' + center + '","name":"' + center + '","children":[';
	db.getFriends(req.session.user, function(info, err) {
		var data = JSON.stringify(info);
		var parseData = JSON.parse(data);
		var friends = JSON.parse(parseData[0].value);
		var friendsTab = friends.friends;
		var friendsList = friendsTab.split("\t");

		if (friendsList != undefined || friendsList.length != 0) {
			for (var i = 0; i < (friendsList.length-1); i++) {
				json += '{';
				json += '"id": "' + friendsList[i] + '",';
				json += '"name": "' + friendsList[i] + '",';
				json += '"data": {},';

				if (i != friendsList.length -2) {
					json += '"children": []}, ';
				} else {
					json += '"children": []}';
				}
			}	
		}

		json += '],"data": []}';

		res.send(json);
	});
}

var recommendation_data = function(req, res) {
	var users = [];
	var output = "";

	const fs = require('fs');

	db.search(function(data, err) {
		if (data != null) {
			var parse = JSON.parse(data);
			users = parse.users;

			async.each(users, function(user, callbck2) {
				var interests = "";
				var affiliation = "";

				//get user's friends
				db.getFriends(user, function(info2) {
					if (info2 != null) {
						var data = JSON.stringify(info2);
						var parseData = JSON.parse(data);
						var parseFriends = JSON.parse(parseData[0].value);
						var friendsList = parseFriends.friends;
						var friendsComma = friendsList.replace(/\t/g, ",");
						var friends = friendsComma.slice(0, -1);
						var listoffriends = friends.split(",");
						for (var a = 0; a < listoffriends.length; a++) {
							output += user + "\t" + listoffriends[a] + "\n";
						}

					}
					//get user's interests and affiliation
					db.getUserInfo(user, function(info3) {
						var data = JSON.stringify(info3);
						var parseData = JSON.parse(data);
						var userInfo = JSON.parse(parseData[0].value);

						affiliation = userInfo.affiliation;
						interests = userInfo.interests;

						var listofinterests = interests.split(",");
						for (var a = 0; a < listofinterests.length; a++) {
							output += user + "\t" + listofinterests[a] + "\n";
							output += listofinterests[a] + "\t" + user + "\n";
						}

						output += user + "\t" + affiliation + "\n";
						output += affiliation + "\t" + user + "\n";

						callbck2();
					});
				});
			}, function (err) {
				fs.writeFile('recommendationdata.txt', output, (err) => {
					if (err) throw err;

					console.log("done");
				})
				res.redirect("/restaurants");
			});
		}
	});
};

var import_data = function(req, res) {
	var recommendations = []
	db.search(function(data, err) {
		if (data != null) {
			var parse = JSON.parse(data);
			var users = parse.users;

			const fs = require('fs');
			var text = fs.readFileSync('./routes/part-r-00000.txt','utf8');
			var textbyline = text.split("\n");

			for (var a = 0; a < textbyline.length; a++) {
				var recommendation = textbyline[a].split("\t");
				if (recommendation[0] == req.session.user) {
					if (users.includes(recommendation[1]) && !recommendations.includes(recommendation[1])) {
						recommendations.push(recommendation[1]);
						console.log(recommendation[1]);
					}
				} else if (recommendation[1] == req.session.user) {
					if (users.includes(recommendation[0]) && !recommendations.includes(recommendation[0])) {
						recommendations.push(recommendation[0]);
						console.log(recommendation[0]);
					}
				}
			}
		}
		res.render('recommendations.ejs', {
			list: recommendations,
			currentUser: req.session.user
		});
	});
}

//Start chat
var startChat = function(req, res) {
	
	var user2 = req.body.user;
	var user = req.session.user;
	
	var chatID = user2+ "-" + user;
	

		db.myDB_getChat(chatID, function(info) {
				var chat = null;
				
				if (info != null) {
					var parse = JSON.parse(info);
					user = parse.user;
					comment = parse.comment;
					

					console.log("THE PARSED DATA IS " + user);
					console.log("THE 2nd PARSED DATA IS " + comment);
					
				}
				res.render('index.ejs', {
					user: user,
					comment: comment
				});

		});
	

};

var getChatInfo = function(req, res) {
	
	db.getChatInfo(function(info) {
		var user = req.session.user; 
		res.send({
			user: user, 
			info: info
		});
	}); 	
}; 

var routes = {
	main : getMain,
	login_check : loginCheck,
	signup : toSignup,
	create_account : createAccount,
	restaurants : restaurants,
	restaurant_add : addRestaurant,
	getAllRestaurants : getAllRestaurants,
	logout : toLogout,
	deleteRest : deleteRest,
	view_profile: view_profile,
	add_friend: add_friend,
	send_message: send_message,
	get_update_profile: get_update_profile,
	update_profile: update_profile,
	add_comment: add_comment,
	search: search,
	exit_logout: exit_logout,
	search_page: search_page,
	visualization: visualizationJson,
	recommendation_data: recommendation_data,
	startChat: startChat,
	getChatInfo: getChatInfo,
	import_data: import_data,
	show_visualization: show_visualization,
	visualizationFriends: visualizationFriends,
	add_like: add_like,
	add_like2: add_like2,
	add_comment_profile: add_comment_profile
};

module.exports = routes;
