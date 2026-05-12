V1.12 - Logout - how to end your session.
=========================================
Go to /logout
This will end the session by deleting the server side record for the session.
(This will invalidate the client side cookie)

v1.11 - NoSQL Injection demo (caught by Joi and Mongo Sanitizer)
================================================================
See /nosql-injection for instructions on how to demo an SQL Injection

The demo explains that you can use Postman to simulate a POST request
with a carefully created body payload to perform an NoSQL Injection Attack.

v1.10 - MongoDB for creating users and login.
=============================================
Adding another MongoDB database for the users and BCrypted passwords.
We are finally removing the in-memory 'database'.
This will ensure our user list persists when the server restarts.

We will keep our session database session from our user database.
This is why we have separate environment variables
MONGODB_SESSION_DATABASE for storing session information 
AND 
MONGODB_USER_DATABASE for users and BCrypted passwords. 

We will be using both Joi and MongoDB Sanitizer to prevent NoSQL Injection attacks.

v1.9 - Keeping secrets, secret with dotenv
==========================================
It's time we separate our passwords and secret keys from our code.
A password or secret_key should not be stored in a git repo.

We'll remove the passwords and secrets from the code and into a .env file.
Then we'll add a rule to our .gitignore file to exclude the .env file from entering our repo.

All secrets should be put in the .env file.
What is a secret?
 - Database Usernames and Passwords (as part of connection strings)
 - Encryption keys
 - API keys

- Follow along instructions:
npm install dotenv

Move secrets to the .env file
 *remove the enclosing quotes on string values
 *remove spaces before and after the equals symbol (=)
 *use uppercase for naming convention
 *no semicolon (;) at the end of a line
 *use can use a hash symbol (#) to make the rest of the line a comment
Ex:  DB_USERNAME=ElephantMan   #Comment: This user has read-only access to the DB
Ex2: DB_PASSWORD=A%r_bT90!KlBebv

- Notes:
When moving this code to production environments, you'll need to create
and populate the .env file on those systems (remember production will need
them, they aren't in the source code and otherwise your code will not run)

v1.8 - Sessions - With Encryption
===============================
Being able to read the session information on the server side is bad, 
because if someone gets access to the session database on mongodb, 
they can see session information. 

But fortunately, it's simple to encrypt it!!

- Follow along instructions:
Generate a new GUID for your mongodb_session_secret
(it should be different from your node_session_secret)
at: https://guidgenerator.com/
or: https://www.uuidgenerator.net/guid
or: https://www.guidgen.com/

- To Test:
Create a user http://localhost:3000/createUser
(remember to create some users - your server likely got rebooted and all users got deleted)

Attempt to log in http://localhost:3000/login
If you put in the same password it should go here: http://localhost:3000/loggedin

Open your mongo session database and you NOT be able to see the session information (usernames)
(the information IS still there, but now it's encrypted and impossible to read by hand 
and without the encryption key)

- Notes:
You should not store your mongodb username and password or your encryption secrets
in your source code and in your git repo.
 (again, we'll fix this later)

v1.7 - Sessions - No Encryption
===============================
In the previous "Login" version, we were supposed to go to /login,
enter our user and password and if our user was found _and_ the password was correct
it would let us go to /loggedin.
However, there was nothing preventing us from going to directly to /loggedin 
before logging in. Let's fix this with sessions.

Sessions store a cookie on the client side and a matching id on the server.
The server can store some data to confirm the user is properly logged in.
A valid session will only exist if you have logged in with the correct password (as an existing user)

I've chosen to store these sessions (the server side info) in a mongodb database,
but there are other ways to do this as well, MySQL, MS SQL, Redis, etc 
(See documentation for details: https://www.npmjs.com/package/express-session#compatible-session-stores)

I've set up a mongodb database for free on Atlas (https://www.mongodb.com/atlas/database)
Once setup, you can access your mongodb via the connection string Atlas provides you
ex: mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}
${mongodb_host} gets replaced with the host - ex: cluster0.1234abc.mongodb.net
${mongodb_user} gets replaced with the user, 
${mongodb_password} is replaced with the mongodb password,
 and ${mongodb_database} replaced with the database name - usually 'sessions')

- Follow along instructions:
npm install express-session
npm install connect-mongo
Generate your own GUID for your node_session_secret
at: https://guidgenerator.com/
or: https://www.uuidgenerator.net/guid
or: https://www.guidgen.com/

- To Test:
Create a user http://localhost:3000/createUser
(remember to create some users - your server likely got rebooted and all users got deleted)

Go directly to http://localhost:3000/loggedin, it should now say you aren't logged in
Attempt to log in http://localhost:3000/login
If you put in the same password it should go here: http://localhost:3000/loggedin
If not (wrong password or missing user) it goes back to login page: http://localhost:3000/login

Open your mongo session database and you can see your session with username stored in it (unencrypted)
- Notes:
Sessions are not encrypted on server side. This is BAD. :'(
You should NOT store your mongodb username and password in your source code and in your git repo.
 (again, we'll fix this later)

v1.6 - "Login" - using BCrypt to compare a user's password
==========================================================
If the passwords are no longer stored in plaintext, how do we tell if the 
password someone is entering when logging in is the same as when they created it?

BCrypt has a function to compare the current password with a previously 
hashed password - bcrypt.compareSync()

Let's use it see if we can "login" as user.

- To Test
Create a user http://localhost:3000/createUser
(remember to create some users - your server likely got rebooted and all users got deleted)
Attempt to log in http://localhost:3000/login
If you put in the same password it should go here: http://localhost:3000/loggedin
If not (wrong password or missing user) it goes back to login page: http://localhost:3000/login

- Notes:
We can access the logged in page (/loggedin) without actually going through the login 
process if we know the direct URL. :O This is BAD, and we'll fix it later

v1.5 - Hash passwords using BCrypt
==================================
Storing passwords in plaintext is BAD. 
VERY BAD.
Let's see how to use BCrypt to hash the passwords so no one can see them
(or steal them).

After hashing the passwords with BCrypt, they should look something like:
$2b$12$s2hrmuKearD75p4dkpTFBebvgGSKxeUOH51CwlnDHCmFcjjMIsuW.

- Follow along instructions:
npm install bcrypt

- To Test:
open browser at: http://localhost:3000/createUser
fill in a username and password, hit submit
You should be sent to /submitUser
And the user added. (Page shows a list of all users)
See the passwords are now hashed (and not plaintext)

- Notes: 
Even 2 people have the same password, their hashed passwords are different.
Try it out, create user1 with password "Password".
Create user2 with password "Password" and confirm their hashes are different.

Remember too, if/when you reboot the server all users are deleted again. 

v1.4 - Create a user using in-memory 'database'
===============================================
In this version we create an in-memory 'database'
where we store the users in an array, but it's only in the server's RAM
so if you restart node or reboot the computer, it gets erased (this is bad
but we'll fix this later).

/createUser  => form for entering username and password to create a new user

- To Test:
open browser at: http://localhost:3000/createUser
fill in a username and password, hit submit
You should be sent to /submitUser
And the user added. (Page shows a list of all users)
The list will grow for each time you post to add a new user

- Notes: 
If you reboot the server (restart nodemon) ALL USERS ARE DELETED! (not a real database) :O
Passwords stored in plaintext!! :O (this is VERY BAD!)

v1.3 - Form fields and POSTs
============================
How do we handle the text input when the user presses the submit button?

In this version we've created a page at /contact and it will
prompt for an email address. When you click on the button, it will
go to /submitEmail and acknowledge the email you entered.
If you didn't enter an email address, it will redirect you back
to /contact with a query parameter that will say the email address is required

- To test:
open browser at: http://localhost:3000/contact
try to hit the submit button (without an email address)
it should redirect to http://localhost:3000/contact?missing=1 
which will show an additional message about the email being required.
This time, put in an email address (ex: a@b.ca) and it will post you email to
http://localhost:3000/submitEmail and echo your email

v1.2 - Catch All and 404s
=========================
What happens if we go to a page that doesn't exist?

Previous versions will give an error message (https://localhost:3000/does_not_exist):
Cannot GET /does_not_exist

Let's fix this!

- To test:
open browser at: https://localhost:3000/does_not_exist
Should not say "Page not found - 404"
(also sends status 404)
Any route (page) not specified before the catch all will give a 404.

v1.1 - Simple Website playing with routes and URL and query params
==================================================================
I want to create a 2nd page at /about to show my name

- To test:
open browser at: https://localhost:3000/about
You should see Patrick Guichon in large print (an <H1> tag)

I want to have my name on the /about page change color
(using a URL parameter ex: /about?color=red OR /about?color=green OR /about?color=%239000C0)

- To test:
open browser at: https://localhost:3000/about?color=blue
You should see Patrick Guichon in blue.
Change the color URL parameter to change the color of the text

I want to display a few of my cats
/cat/1 and /cat/2
(using 'folders' as parameters)
pictures will be in a public folder. 
1 => fluffy.gif
2 => socks.gif

-To Test:
open browser at: https://localhost:3000/cat/1 
 see Cat 1 (fluffy.gif)
open browser at: https://localhost:3000/cat/2 
 see Cat 2 (socks.gif)
open browser at: https://localhost:3000/cat/3 
 see Error message that cat #3 doesn't exist

(You can also test by going to the images directly at https://localhost:3000/fluffy.gif and https://localhost:3000/socks.gif)

Image Credits: 
"fluffy" https://tenor.com/view/jinki948-cat-shocked-shocked-face-shock-gif-22585372
"socks" https://tenor.com/view/cat-shaking-leg-pukich-nasral-gif-18887227

v1.0 - Simple Website using Node.js
===================================

- Follow along instructions:
(these steps have already been run - no need to run them again)
Steps:
1. npm init (all defaults are fine)
2. npm install
3. npm install express
4. create new file app.js
5. app.js has boilerplate express server code


- Instructions to run:
npm install
nodemon app.js

- Git:
add a .gitignore to ignore all files in /node_modules


- To test:
open browser at: https://localhost:3000
You should see Hello World in large print (an <H1> tag)

- Notes:
You can go to the root, but no other sites
You will get an error for example if you go to /about or /login 
  (there's no code to handle these routes)