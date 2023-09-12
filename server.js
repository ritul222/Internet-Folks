
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 10;
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Database connected successfully')).catch(e => console.log('Not connected'));

function generateSnowflakeId(workerId, customEpoch = 1609459200000) {
  const timestamp = Date.now() - customEpoch;
  const workerBits = 5;
  const maxWorkerId = -1 ^ (-1 << workerBits);

  if (workerId > maxWorkerId || workerId < 0) {
    throw new Error(`Worker ID must be between 0 and ${maxWorkerId}`);
  }

  const timestampBits = 41;
  const workerShift = 12;
  const timestampShift = 17;

  return (
    ((timestamp << timestampShift) | (workerId << workerShift)) >>> 0
  ).toString();
}


const workerId = 2;
const snowflakeId = generateSnowflakeId(workerId);

console.log(snowflakeId);

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => generateSnowflakeId(workerId), // Generating a Snowflake-like ID as the default value
    unique: true,
  },
  name: {
    type: String,
    default: null,
    maxlength: 64,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 128,
  },
  password: {
    type: String,
    required: true,
    maxlength: 64,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

////////////////////////////////////////////////////////////

// Community model
const communitySchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => generateSnowflakeId(workerId), // Generating a Snowflake-like ID as the default value
    unique: true,
  },
  name: {
    type: String,
    default: null,
    maxlength: 128,
  },
  slug: {
    type: String,
    // unique: true,
    maxlength: 255,
    sparse:true,

  },
  owner: {
    type: String,
    ref: 'User', // Reference to the User model
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: null,
  },
});

const Community = mongoose.model('Community', communitySchema);

///////////////////////////////////////////////////////////////////////////////////////
// Role schema
const roleSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => generateSnowflakeId(workerId), // Generating a Snowflake-like ID as the default value
    unique: true,
  },
  name: {
    type: String,
    unique: true,
    maxlength: 64,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: null,
  },
});

const Role = mongoose.model('Role', roleSchema);
//////////////////////////////////////////////////////////////////////////////////////////
// Members

const membersSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => generateSnowflakeId(workerId), // Generating a Snowflake-like ID as the default value
    unique: true,
  },
  community: {
    type: String,
    ref: 'Community', // Reference to the Community model
  },
  user: {
    type: String,
    ref: 'User', // Reference to the User model
  },
  role: {
    type: String,
    ref: 'Role', // Reference to the Role model
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Members = mongoose.model('Members', membersSchema);

//////////////////////////////////////////////////////////////////////////////////////////////////////


app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {

    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const userId = generateSnowflakeId(workerId);


    const newUser = new User({
      id: userId, // Set the generated Snowflake-like ID as the user's ID
      name,
      email,
      password: hashedPassword, // Store the hashed password
    });

    const savedUser = await newUser.save();

    console.log('User saved:', savedUser);
 
    res.redirect('/login.html');
  } catch (error) {
    console.error('Error during signup:', error);

    res.status(500).send('Error occurred while signing up');
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    // Compare the entered password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
   
      res.redirect('/community'); 
    } else {
      // Passwords don't match
      res.status(401).send('Invalid email or password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/createCommunity', async (req, res) => {
  const { communityName } = req.body;

  if (!communityName) {
    return res.status(400).send('Invalid community name.');
  }

  // Function to generate a unique slug based on the community name
  async function generateUniqueSlug(name, suffix = '') {
    const slug = name.toLowerCase().replace(/\s+/g, '-') + suffix;
    const existingCommunity = await Community.findOne({ slug });
    if (!existingCommunity) {
      return slug;
    }

    const newSuffix = (suffix || 0) + 1;
    return generateUniqueSlug(name, newSuffix);
  }

  // Generate a unique slug for the new community
  const slug = await generateUniqueSlug(communityName);

  // Create a new Community document with the unique slug
  const newCommunity = new Community({ name: communityName, slug });

  try {
    const savedCommunity = await newCommunity.save();
    console.log('Community saved successfully:', savedCommunity);
    res.status(201).json({ message: 'Community created successfully' });
  } catch (error) {
    console.error('Error saving community:', error);
    res.status(500).json({ error: 'Error occurred while creating the community' });
  }
});





app.get('/', (req, res) => {
  res.sendFile(__dirname + '/home.html', (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error loading home.html');
    }
  });
});

app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/signup.html', (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error loading signup.html');
    }
  });
});

app.get('/getCommunities', async (req, res) => {
  try {
  
    const communities = await Community.find({}, 'name');
    const communityNames = communities.map(community => community.name);
    res.json(communityNames);
  } catch (error) {
    console.error('Error fetching community names:', error);
    res.status(500).send('Error occurred while fetching community names.');
  }
});


app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/login.html', (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error loading login.html');
    }
  });
});

app.get('/community', (req, res) => {
  res.sendFile(__dirname + '/community.html', (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error loading community.html');
    }
  });
});
app.get('/script.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(__dirname + '/script.js');
});


app.post('/removeMember', async (req, res) => {
  const { communityName, memberUsername } = req.body;

  if (!communityName || !memberUsername) {
    return res.status(400).json({ error: 'Community name and member username are required' });
  }

  try {
    // Find the community by name
    const community = await Community.findOne({ name: communityName });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Remove the member from the database
    const result = await Members.deleteOne({ community: community.id, user: memberUsername });

    if (result.deletedCount === 1) {
      res.json({ message: 'Member removed from the community' });
    } else {
      res.status(404).json({ error: 'Member not found in the community' });
    }
  } catch (error) {
    console.error('Error removing member from the community:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Modify the addMember route to accept communityName instead of communityId
app.post('/addMember', async (req, res) => {
  const { communityName, memberName } = req.body;
  if (!communityName || !memberName) {
    return res.status(400).json({ error: 'Community and member names are required' });
  }

  try {
    // Find the community by name
    const community = await Community.findOne({ name: communityName });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Create a new member instance
    const newMember = new Members({ community: community.id, user: memberName });

    // Save the new member to the database
    newMember.save()
      .then(savedMember => {
        console.log('Member saved successfully:', savedMember);
        res.json({ message: 'Member added to the community', community: savedMember });
      })
      .catch(error => {
        console.error('Error saving member:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  } catch (error) {
    console.error('Error adding member to the community:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.post('/joinCommunity', async (req, res) => {
  try {
    // Get the community name and member name from the request body
    const { communityName, memberName } = req.body;

    if (!communityName || !memberName) {
      return res.status(400).json({ success: false, message: 'Community name and member name are required' });
    }

    // Check if the community exists
    const community = await Community.findOne({ name: communityName });

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Create the member with both community and user information
    const newMember = new Members({
      community: community.id,
      user: memberName, // Store the member's name
    });

    await newMember.save();

    const successMessage = `Successfully joined ${communityName} as ${memberName}`;
    res.json({ success: true, message: successMessage });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




app.get('/getCommunityMembers', async (req, res) => {
  const { communityName } = req.query; // Assuming you pass the community name as a query parameter

  console.log('Received request for community:', communityName); // Add this line for debugging

  try {
    // Find the community by name
    const community = await Community.findOne({ name: communityName });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Find all members in the community
    const members = await Members.find({ community: community.id }, 'user');

    if (members.length > 0) {
      const memberUsernames = members.map(member => member.user);
      res.json({ members: memberUsernames });
    } else {
      res.json({ members: [] }); // Return an empty array if no members found
    }
  } catch (error) {
    console.error('Error fetching community members:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.get('/getCommunityMembers', async (req, res) => {
  const { communityName } = req.query;

  if (!communityName) {
    return res.status(400).json({ error: 'Community name is required' });
  }

  try {
    // Find the community by name
    const community = await Community.findOne({ name: communityName });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Find all members in the community
    const members = await Members.find({ community: community.id }, 'user');

    if (members.length > 0) {
      const memberUsernames = members.map(member => member.user);
      res.json({ members: memberUsernames });
    } else {
      res.json({ members: [] }); // Return an empty array if no members found
    }
  } catch (error) {
    console.error('Error fetching community members:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
