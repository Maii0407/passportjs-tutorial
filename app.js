const express = require( 'express' );
const path = require( 'path' );
const session = require( 'express-session' );
const passport = require( 'passport' );
const LocalStrategy = require( 'passport-local' ).Strategy;
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const bcrypt = require( 'bcryptjs' )

const mongoDB = 'mongodb+srv://akmalizuddin:01114862495@pmi-cluster.h1ysz.mongodb.net/passportJS?retryWrites=true&w=majority';
mongoose.connect( mongoDB, { useUnifiedTopology: true, useNewUrlParser: true });

const User = mongoose.model(
  'User',
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
  })
);

const app = express();
app.set( "views", __dirname );
app.set( "view engine", "pug" );

app.use( session({ secret: "cats", resave: false, saveUninitialized: true }));

/*passport.use(
  new LocalStrategy( ( username, password, done ) => {
    User.findOne({ username: username }, ( err, user ) => {
      if( err ) { return done( err ); }
      if( !user ) {
        return done( null, false, { message: 'Wrong username' } );
      }
      if( user.password !== password ) {
        return done( null, false, { message: 'Wrong password' });
      }
      return done( null, user );
    });
  })
);*/

passport.use(
  new LocalStrategy( ( username, password, done ) => {
    User.findOne({ username: username }, ( err, user ) => {
      if( err ) { return done( err ); }
      if( !user ) {
        return done( null, false, { message: 'Wrong username' } );
      }
      if( user.password !== password ) {
        bcrypt.compare( password, user.password, ( err, res ) => {
          if( res ) {
            return done( null, user );
          }
          else {
            return done( null, false, { message: 'Wrong password' });
          }
        })
      }
    });
  })
);

passport.serializeUser( ( user, done ) => {
  done( null, user.id );
});

passport.deserializeUser( ( id, done ) => {
  User.findById( id, ( err, user ) => {
    done( err, user );
  });
});

app.use( passport.initialize() );
app.use( passport.session() );
app.use( express.urlencoded({ extended: false }) );

app.use( ( req, res, next ) => {
  res.locals.currentUser = req.user;
  next()
});

//GET methods
app.get( '/', ( req, res ) => {
  res.render( 'index', { user: req.user } )
});

app.get( '/sign-up', ( req, res ) => res.render( 'sign_up_form' ));

app.get( '/log-out', ( req, res ) => {
  req.logout( ( err ) => {
    if( err ) { return next( err ); }

    res.redirect( '/' );
  });
});

//POST methods
app.post( '/sign-up', ( req, res, next ) => {
  bcrypt.hash( `${ req.body.password }`, 10, ( err, hashedPassword ) => {
    if( err ) { return next( err ); }

    const user = new User({
      username: req.body.username,
      password: hashedPassword
    }).save( err => {
      if( err ) { return next( err ); }

      res.redirect( '/' );
    })
  })
});

app.post( '/log-in', passport.authenticate( 'local', {
  successRedirect: '/',
  failureRedirect: '/'
}));

app.listen( 3000, () => console.log( 'App listening on port 3000' ));