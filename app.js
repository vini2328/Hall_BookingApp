const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/hallbooking', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });

// Room Schema
const roomSchema = new mongoose.Schema({
  seats: { type: Number, required: true },
  amenities: [{ type: String }],
  price: { type: Number, required: true },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }]
}, {
  strictPopulate: false // Set strictPopulate option to false
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  }
});

// Room Model
const Room = mongoose.model('Room', roomSchema);

// Booking Model
const Booking = mongoose.model('Booking', bookingSchema);

// API Endpoint: Create a Room
app.post('/rooms', (req, res) => {
  const { seats, amenities, price } = req.body;
  const room = new Room({ seats, amenities, price });
  room.save()
    .then(savedRoom => {
      res.json(savedRoom);
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to create a room.' });
    });
});

// API Endpoint: Book a Room
app.post('/bookings', (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;

  const booking = new Booking({ customerName, date, startTime, endTime, roomId });
  booking.save()
    .then(savedBooking => {
      res.json(savedBooking);
    })
    .catch(error => {
      console.error('Failed to book a room:', error);
      res.status(500).json({ error: 'Failed to book a room.' });
    });
});

// API Endpoint: List all Rooms with Booked data
app.get('/rooms/bookings', (req, res) => {
  Room.find()
    .populate({
      path: 'bookings',
      select: 'customerName date startTime endTime',
      options: { sort: { date: 1, startTime: 1 } }
    })
    .then(rooms => {
      const roomBookings = rooms.map(room => {
        const booking = room.bookings.length > 0 ? room.bookings[0] : null;
        if (booking) {
            console.log(booking)
          return {
            roomName: `Room ${room.id}`,
            bookedStatus: 'Booked',
            customerName: booking.customerName,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime
          };
        } else {
            console.log('else',booking)
          return {
            roomName: `Room ${room.id}`,
            bookedStatus: 'Not Booked',
            customerName: '',
            date: '',
            startTime: '',
            endTime: ''
          };
        }
      });
      res.json(roomBookings);
    })
    .catch(error => {
      console.error('Failed to fetch room bookings:', error);
      res.status(500).json({ error: 'Failed to fetch room bookings.' });
    });
});

// API Endpoint: List all Customers with Booked data
app.get('/customers/bookings', (req, res) => {
  Booking.find()
    .populate('roomId', 'seats amenities price')
    .then(bookings => {
      const customerBookings = bookings.map(booking => {
        const room = booking.roomId;
        return {
          customerName: booking.customerName,
          roomName: `Room ${room.id}`,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime
        };
      });
      res.json(customerBookings);
    })
    .catch(error => {
      console.error('Failed to fetch customer bookings:', error);
      res.status(500).json({ error: 'Failed to fetch customer bookings.' });
    });
});

// API Endpoint: List the number of times a Customer has booked a Room
app.get('/customers/:customerName/bookings', (req, res) => {
  const { customerName } = req.params;
  Booking.find({ customerName })
    .populate('roomId', 'seats amenities price')
    .then(bookings => {
      res.json(bookings);
    })
    .catch(error => {
      console.error('Failed to fetch customer bookings:', error);
      res.status(500).json({ error: 'Failed to fetch customer bookings.' });
    });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
