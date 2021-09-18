/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  test('#example Test GET /api/books', function(done){
     chai.request(server)
      .get('/api/books')
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  });
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function() {


    suite('POST /api/books with title => create book object/expect book object', function() {
      
      test('Test POST /api/books with title', function(done) {
        chai
            .request(server)
            .post('/api/books')
            .send({title: 'The Gruffalo'})
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.isObject(res.body, 'Response should be an object');
              assert.property(res.body, '_id', 'Response should include _id');
              assert.propertyVal(res.body, 'title', 'The Gruffalo');
              done();
            })
      });
      
      test('Test POST /api/books with no title given', function(done) {
        chai
            .request(server)
            .post('/api/books')
            .send()
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.isString(res.text, 'Response should be an string');
              assert.equal(res.text, 'missing required field title', 'Response should be missing required field title');
              done();
            })
      });
      
    });


    suite('GET /api/books => array of books', function(){
      
      test('Test GET /api/books',  function(done){
        chai.request(server)
            .get('/api/books')
            .end(function(err, res){
              assert.equal(res.status, 200);
              assert.isArray(res.body, 'response should be an array');
              assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
              assert.property(res.body[0], 'title', 'Books in array should contain title');
              assert.property(res.body[0], '_id', 'Books in array should contain _id');
              done();
            });
      });      
      
    });


    suite('GET /api/books/[id] => book object with [id]', function(){
      
      test('Test GET /api/books/[id] with id not in db',  function(done){
        chai
            .request(server)
            .get('/api/books/peepeepoopoo')
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'no book exists');
              done();
            })
      });
      
      test('Test GET /api/books/[id] with valid id in db',  function(done){
        chai
            .request(server)
            .post('/api/books')
            .send({title: 'The Twits'})
            .end((err, res) => {
              let ourId = res.body._id;
              chai.request(server)
                  .get(`/api/books/${ourId}`)
                  .end((err1, res1) => {
                    assert.equal(res1.status, 200);
                    assert.isObject(res1.body);
                    assert.property(res1.body, 'title');
                    assert.property(res1.body, '_id');
                    assert.property(res1.body, 'comments');
                    assert.isArray(res1.body.comments);
                    assert.equal(res1.body.title, 'The Twits');
                    done();
                  })
            })
      });
      
    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      test('Test POST /api/books/[id] with comment', function(done){
        chai
            .request(server)
            .post('/api/books')
            .send({title: 'The Twits'})
            .end((err, res) => {
              let ourId = res.body._id;
              chai.request(server)
                  .post(`/api/books/${ourId}`)
                  .send({comment: 'I love this book!'})
                  .end((err1, res1) => {
                    assert.equal(res1.status, 200);
                    assert.isObject(res1.body);
                    assert.property(res1.body, 'title');
                    assert.property(res1.body, '_id');
                    assert.property(res1.body, 'comments');
                    assert.isArray(res1.body.comments);
                    assert.include(res1.body.comments[0], 'I love this book!')
                    assert.equal(res1.body.title, 'The Twits');
                    done();
                  })
            })
      });

      test('Test POST /api/books/[id] without comment field', function(done){
        chai
            .request(server)
            .post('/api/books')
            .send({title: 'The Twits'})
            .end((err, res) => {
              let ourId = res.body._id;
              chai.request(server)
                  .post(`/api/books/${ourId}`)
                  .end((err1, res1) => {
                    assert.equal(res1.status, 200);
                    assert.isString(res1.text);
                    assert.equal(res1.text, 'missing required field comment');
                    done();
                  })
            })
      });

      test('Test POST /api/books/[id] with comment, id not in db', function(done){
        chai.request(server)
            .post('/api/books/peepeepoopoo')
            .send({comment: 'I liked the bit with the glue'})
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'no book exists');
              done();
            })
      });
      
    });

    suite('DELETE /api/books/[id] => delete book object id', function() {

      test('Test DELETE /api/books/[id] with valid id in db', function(done){
        chai
            .request(server)
            .post('/api/books')
            .send({title: 'The Twits'})
            .end((err, res) => {
              let ourId = res.body._id;
              chai.request(server)
                  .delete(`/api/books/${ourId}`)
                  .end((err1, res1) => {
                    assert.equal(res1.status, 200);
                    assert.equal(res1.text, 'delete successful');
                    chai.request(server)
                        .get(`/api/books/${ourId}`)
                        .end((err2, res2) => {
                          assert.equal(res2.status, 200);
                          assert.equal(res2.text, 'no book exists');
                          done();
                        })
                  })
            })
      });

      test('Test DELETE /api/books/[id] with  id not in db', function(done){
        chai.request(server)
            .delete('/api/books/peepeepoopoo')
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'no book exists');
              done();
            })
      });

    });

  });

});
