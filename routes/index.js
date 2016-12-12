var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');

router.get('/', function(req, res) {
  res.setLocale(config.locale);
  res.render('index', { community: config.community,
                        tokenRequired: !!config.inviteToken });
});

router.post('/invite', function(req, res) {
  if (req.body.email && (!config.inviteToken || (!!config.inviteToken && req.body.token === config.inviteToken))) {
    request.post({
        url: 'https://'+ config.slackUrl + '/api/users.admin.invite',
        form: {
          email: req.body.email,
          token: config.slacktoken,
          set_active: true
        }
      }, function(err, httpResponse, body) {
        // body looks like:
        //   {"ok":true}
        //       or
        //   {"ok":false,"error":"already_invited"}
        if (err) { return res.send('Error:' + err); }
        body = JSON.parse(body);
        if (body.ok) {
          res.render('result', {
            community: config.community,
            message: 'Проверете "'+ req.body.email +'" за покана от Slack.'
          });
        } else {
          var error = body.error;
          if (error === 'already_invited' || error === 'already_in_team') {
            res.render('result', {
              community: config.community,
              message: 'Вие вече сте поканен.<br>' +
                       'Отиди на <a href="https://'+ config.slackUrl +'">'+ config.community +'</a>'
            });
            return;
          } else if (error === 'invalid_email') {
            error = 'Имейлът, който сте въвели не е валиден имейл.';
          } else if (error === 'invalid_auth') {
            error = 'Нещо се обърка. Моля свържете се с администратора.';
          }

          res.render('result', {
            community: config.community,
            message: 'Грешка! ' + error,
            isFailed: true
          });
        }
      });
  } else {
    var errMsg = [];
    if (!req.body.email) {
      errMsg.push('Въвеждането на имейл е задължително');
    }

    if (!!config.inviteToken) {
      if (!req.body.token) {
        errMsg.push('Валиден ключ е задължително поле');
      }

      if (req.body.token && req.body.token !== config.inviteToken) {
        errMsg.push('Ключът, който сте въвели е невалиден');
      }
    }

    res.render('result', {
      community: config.community,
      message: 'Грешка! ' + errMsg.join(' and ') + '.',
      isFailed: true
    });
  }
});

module.exports = router;
