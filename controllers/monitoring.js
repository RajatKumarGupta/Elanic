'use strict';

const HttpStatus = require('http-status-codes');
const request = require('request-promise');
const UrlDetail = require('../models/urldata');

const saveDetails = async (req, res) => {
  const { url, data, method, header } = req.body;
  if (!url || !method) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Params Missing!',
      status: false,
    });
  }
  const reqOptions = {
    uri: url,
    method,
    body: data,
    json: true,
  };
  let start, end;
  try {
    start = new Date().getTime();
    await request(reqOptions);
    end = new Date().getTime();
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error while making request',
      error: e,
      status: false,
    });
  }
  try {
    await UrlDetail.update({ url, data, method }, {
      $set: {
        url,
        method,
        data,
        header,
      }
    }, { upsert: true });

    const detail = await UrlDetail.findOne({ url, data, method });

    return res.status(HttpStatus.OK).json({
      id: detail._id,
      status: true,
    });

  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error while saving details please see logs',
      error: JSON.stringify(e),
      status: false,
    });
  }

};

const getDetails = async (req, res) => {
  let rsp;
  if (req.params.id) {
    try {
      rsp = await UrlDetail.findOne({ _id: req.params.id });
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Error while fetching details for ${req.params.id} please see logs`,
        error: JSON.stringify(e),
        status: false,
      });
    }
    if (!rsp) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `No record with ${req.params.id} found in db`,
        status: false,
      });
    }
    return res.status(HttpStatus.OK).json({
      responses: rsp.responses,
      '50th_percentile': rsp.responses[rsp.responses - 49] || 0,
      '75th_percentile': rsp.responses[rsp.responses - 75] || 0,
      '95th_percentile': rsp.responses[rsp.responses - 95] || 0,
      '99th_percentile': rsp.responses[rsp.responses - 99] || 0,
      method: rsp.method,
      data: rsp.data,
      headers: rsp.headers,
      url: rsp.url,
      status: true,
      _id: req.params.id
    });
  }
  try {
    rsp = await UrlDetail.find({}, { url: 1 });
    return res.status(HttpStatus.OK).json({
      responses: rsp,
      status: true,
    });
  } catch (e){
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error while fetching details please see logs',
      error: JSON.stringify(e),
      status: false,
    });
  }
};

const updateDetails = async (req, res) => {
  let rsp;
  if (!req.params.id) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: `url _id is a required field`,
      status: false,
    });
  }
  try {
    rsp = await UrlDetail.findOne({_id: req.params.id}, { url: 1 });
    if(!rsp){
      return res.status(HttpStatus.BAD_REQUEST).json({
        responses: `No record found with ${req.params.id} url id`,
        status: false,
      });
    }
    await UrlDetail.update({_id: req.params.id},  req.body );
    return res.status(HttpStatus.OK).json({
      responses: `Update success`,
      status: true,
      _id: req.params.id
    });
  } catch (e){
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error while updating details please see logs',
      error: JSON.stringify(e),
      status: false,
    });
  }
};

const deleteDetails = async (req, res) => {
  let rsp;
  if (!req.params.id) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: `url _id is a required field`,
      status: false,
    });
  }
  try {
    rsp = await UrlDetail.remove({_id: req.params.id});
    return res.status(HttpStatus.OK).json({
      responses: `Delete success`,
      status: true,
      _id: req.params.id
    });
  } catch (e){
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error while deleting details please see logs',
      error: JSON.stringify(e),
      status: false,
    });
  }
};

const trackResponseTime = async(req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Params Missing!',
      status: false,
    });
  }

  try{
    const urlDetails = await UrlDetail.findOne({_id : id});
    if(!urlDetails) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'No saved data for request you made',
        status: false,
      });
    }
    const reqOptions = {
      uri: urlDetails.url,
      method: urlDetails.method,
      body: urlDetails.data,
      header: urlDetails.header,
      json: true,
    };
    let start, end;
    start = new Date().getTime();
    try{
      await request(reqOptions);
    } catch(e){
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error while making request',
        error: e,
        status: false,
      });
    }
    end = new Date().getTime();
    await UrlDetail.update({_id : id}, {
      $push: {
        responses: end - start,
      }
    })
    return res.status(HttpStatus.OK).json({
      responses: `Pinged success`,
      status: true,
      _id: req.params.id
    });
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error fetching details',
      error: e,
      status: false,
    });
  }

}


module.exports = {
  saveDetails,
  getDetails,
  updateDetails,
  deleteDetails,
  trackResponseTime
};