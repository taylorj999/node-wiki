"use strict";
/*global describe:false, it:false, before: false, after: false, beforeEach: false, afterEach: false, expect:false */
process.env.NODE_ENV = "test";

var request = require("supertest");
var expect = require("chai").expect;
var app = require("../app");
var db = require("../db-connector");
var pageFactory = require("./factories/page");
var Page = require("../models/page");
var async = require("async");

describe("Page", function () {
    before(db.connect);
    afterEach(db.wipe);
    after(db.close);

    it("shuold allow path updates", function (done) {
        var newPage = pageFactory();
        request(app)
            .post("/foobar")
            .expect(200)
            .send(newPage)
            .end(function (err, res) {
            request(app)
                .put("/foobar")
                .send({
                newPath: "/foobaz"
            })
                .end(function (err, res) {
                expect(err).to.be.null;

                async.parallel([
                    function (cb) {
                        Page.count({path: "/foobar"}, function (err, count) {
                            expect(err).to.be.null;
                            expect(count).to.eql(0);
                            cb(err);
                        });
                    },
                    function (cb) {
                        Page.count({path: "/foobaz"}, function (err, count) {
                            expect(err).to.be.null;
                            expect(count).to.eql(1);
                            cb(err);
                        });
                    }
                ], done);
            });
        });
    });

    it("shuold not allow path update on existing path", function (done) {
        async.parallel([function (cb) {
            var newPage = pageFactory();
            var page = new Page(newPage);
            page.path = "/foobar";
            page.save(cb);
        },
        function (cb) {
            var newPage = pageFactory();
            var page = new Page(newPage);
            page.path = "/foobaz";
            page.save(cb);
        }], function (err) {
            request(app)
                .put("/foobar")
                .send({newPath: "/foobaz"})
                .expect(200)
                .end( function (err, res) {
                    var response = JSON.parse(res.text);
                    expect(response.status).to.eql("page-exists");

                    done(err);
                });
        });

    });
});
