'use strict';

const express = require('express');

const bookmarkRouter = express.Router();
const bodyParser = express.json();
const uuid = require('uuid/v4');
const logger = require('./logger');
const bookmarkService = require('./bookmark-service');
const xss = require('xss');

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  name: xss(bookmark.name),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});



bookmarkRouter
  .route('/bookmarks')
  .get((req,res,next) => {

    const knexInstance = req.app.get('db');
    bookmarkService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks);
      })
      .catch(next);
  })

  .post(bodyParser, (req,res,next) => {
    const { id,name, url, description,rating } = req.body;
    const newBookmark = { id,name, url, description,rating };

    for (const [key, value] of Object.entries(newBookmark)) {
     
      if (key !== 'description' && (value === null || value === undefined)) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
      if( key === 'rating' && (value <1 || value >5 || isNaN(value))){
        logger.error('rating must be between 1 and 5');
        return res.status(400).json({
          error: { message: 'Invalid rating' }
        });
      }

    }

    bookmarkService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(bookmark);
      })
      .catch(next);

















    /*
    const { title,url,description,rating } = req.body;

    if (!title || !url) {
      logger.error('title and url both required');
      return res
        .status(400)
        .send('Invalid data');
    }
    if(rating && isNaN(rating))
    {
      logger.error('rating must be a number');
      return res
        .status(400)
        .send('Invalid data');
    }
    let rating_num = parseInt(rating);

    if(rating_num <1 || rating_num >5){
      logger.error('rating must be between 1 and 5');
      return res
        .status(400)
        .send('Invalid data');
    }

   
    const book_D = books.find(book => book.title === title && book.url === url );

    if (book_D) {
      logger.error('bookmark already in list');
      return res
        .status(404)
        .send('Bookmark Already Found');
    }
    const id = uuid();

    const bookmark_add = {
      id,
      title,
      url,
      description,
      rating
    };

    books.push(bookmark_add);

  
    logger.info(`bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json({id});
      */
    
  });


bookmarkRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    bookmarkService.getBookmarkById(
      req.app.get('db'),
      req.params.id
    )
   
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: 'Bookmark doesn\'t exist' }
          });
        }
        res.bookmark = bookmark; // save the article for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req,res,next) => {
    return res.json(serializeBookmark(res.bookmark));

    /*
    const book_D = books.find(book => book.id === id);

    // make sure we found a card
    if (!book_D) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Book Not Found');
    }

    res.json(book_D);
    */
  })
  .delete((req,res,next) => {

    const { id } = req.params;
    const knexInstance = req.app.get('db');
    bookmarkService.deleteBookmark(knexInstance,id)
      .then(() => {
        res.status(204).end();
      }
      )
      .catch(next);




    /*
    const { id } = req.params;

    const listIndex = books.findIndex(book => book.id === id);

    if (listIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not Found');
    }

    books.splice(listIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res
      .status(204)
      .end();
      */
  });

module.exports = bookmarkRouter;