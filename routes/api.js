/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const log = require('simple-node-logger').createSimpleLogger();
const NO_SUCH_BOOK_ERROR = 'No such book';
const COMMENT_NOT_SENT_ERROR = 'Missing comment';

log.setLevel('debug');

const Firestore = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'fcc-personallibrary',
  keyFilename: './service-key.json'
})

const bookCollection = db.collection('books');

const getBookById = (bookId) => {
  return bookCollection.where(Firestore.FieldPath.documentId(), '==', bookId);
}

const getOneBookById = async (bookId) => {
    const queryResult = await bookCollection.where(Firestore.FieldPath.documentId(), '==', bookId).get();
    if (queryResult.size === 1) {
        log.info('Book found');
        log.debug(queryResult.docs[0].data());
        return queryResult.docs[0];
    } else if (queryResult.size === 0) {
        throw new Error(NO_SUCH_BOOK_ERROR);
    } else {
        throw new Error('Not unique ID')
    }
}

const bodyParser = require('body-parser');

module.exports = function (app) {

  app.route('/api/georgetest/:id')
      .get(async (req, res) => {
          try {
              const returnedBook = await getOneBookById(req.params.id)
              res.json(returnedBook.data());
          } catch (e) {
              log.error(e);
              res.sendStatus(500);
          }

      })

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      bookCollection.get()
          .then(books => {
            let bookArray = [];
            books.forEach(book => {
              log.info(book.data(), book.id);
              let commentcount = 0;
              if (book.data().comments !== undefined) {
                  commentcount = book.data().comments.length;
              }
              bookArray.push({
                _id: book.id,
                title: book.data().title,
                commentcount
              })
            })
            res.json(bookArray);

          }, error => {
            log.error(error);
          })
    })
    
    .post(function (req, res){
      log.info('Creating book: ', req.body)

      let title = req.body.title;

      if (title === '' || title === undefined) {
        log.error('Missing title');
        res.status(200);
        res.send('missing required field title');
      } else {
        bookCollection.add({
          title,
          comments: []
        })
            .then(book => {
              log.info('Book created with ID ', book.id);
              res.json({
                _id: book.id,
                title
              });
            }, error => {
              log.error('Could not create book');
            })
      }
      //response will contain new book object including atleast _id and title
    })
    
    .delete(async function(req, res){
      //if successful response will be 'complete delete successful'
      log.info('Deleting all books');
      try {
          const allBooks = await bookCollection.get();
          log.info(allBooks.size, ' books retrieved, commencing delete')
          allBooks.forEach((book) => {
              book.ref.delete();
          })

          log.info('All books deleted')
          res.send('complete delete successful')


      } catch (e) {
          log.error(e);
          res.sendStatus(500);
      }
    });



  app.route('/api/books/:id')
    .get(async function (req, res){

      let bookid = req.params.id;

      log.info('Looking for book with ID ', bookid)

      try {
          const returnedBook = await getOneBookById(bookid);
          const returnedComments = returnedBook.data().comments.map(commentObj => commentObj.comment);
          res.json({
              _id: returnedBook.id,
              title: returnedBook.data().title,
              commentcount: returnedBook.data().comments.length,
              comments: returnedComments
          })
      } catch (e) {
          log.error(e);
          res.status(200);
          res.send('no book exists');
      }
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })
    
    .post(async function(req, res){
      let bookid = req.params.id;
      let comment = req.body.comment;



          log.info('Adding comment to book with ID ', bookid);

          try {
              let bookToUpdate = await getOneBookById(bookid);

              if (comment === '' || comment === undefined) {
                  throw new Error(COMMENT_NOT_SENT_ERROR);
              }

              await db.runTransaction(async (t) => {
                  let index = 0;
                  if (bookToUpdate.data().comments !== undefined) {
                      index = bookToUpdate.data().comments.length + 1;
                  }

                  log.debug('Current data ', bookToUpdate.data());
                  log.debug('Current comments ', bookToUpdate.data().comments);

                  const newComments = bookToUpdate.data().comments

                  newComments.push({index, comment});

                  log.debug('Updating comments to ', newComments);

                  t.update(bookToUpdate.ref, {comments: newComments});

              });
              log.info('Transaction successful')
              log.info('Getting updated book')
              let updatedBook = await getOneBookById(bookid);
              const returnedComments = updatedBook.data().comments.map(commentObj => commentObj.comment);
              let updatedBookRes = {
                  _id: updatedBook.id,
                  title: updatedBook.data().title,
                  comments: returnedComments
              }
              res.json(updatedBookRes);
              log.info('Response sent')
          } catch (err) {
              log.error(err);
              if (err.message === NO_SUCH_BOOK_ERROR) {
                  res.status(200);
                  res.send('no book exists');
              } else if (err.message === COMMENT_NOT_SENT_ERROR) {
                  log.error('no comment sent');
                  res.status(200);
                  res.send('missing required field comment');
              }
          }




      //json res format same as .get
    })
    
    .delete(async function(req, res){
      let bookid = req.params.id;

      try {
          const bookToDelete = await getOneBookById(bookid);
          await bookToDelete.ref.delete();
          log.info('Book deleted');
          res.send('delete successful')
      } catch (e) {
          log.error(e);
          if (e.message === NO_SUCH_BOOK_ERROR) {
              res.status(200);
              res.send('no book exists');
          } else {
              res.sendStatus(400);
          }
      }
      //if successful response will be 'delete successful'
    });
  
};
