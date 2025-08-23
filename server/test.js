const mongoose = require('mongoose');
const User = require('./models/User');
const Profile = require('./models/Profile');

async function testDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/careerconnect', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create a test user
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'jobseeker'
        });
        await user.save();
        console.log('Test user created:', user);

        // Create a profile for the test user
        const profile = new Profile({
            userId: user._id,
            education: [],
            experience: [],
            skills: [],
            socialLinks: {
                linkedin: '',
                github: '',
                portfolio: ''
            }
        });
        await profile.save();
        console.log('Test profile created:', profile);

        // Verify profile can be retrieved
        const savedProfile = await Profile.findOne({ userId: user._id });
        console.log('Retrieved profile:', savedProfile);

        // Clean up
        await User.deleteOne({ _id: user._id });
        await Profile.deleteOne({ userId: user._id });
        console.log('Test data cleaned up');

        // Disconnect
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testDatabase(); 