/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/query'],
  function (url, query) {

    function fieldChanged(context) {

      // Navigate to selected page
      if (context.fieldId == 'custpage_pageid') {


        var pageId = context.currentRecord.getValue({
          fieldId: 'custpage_pageid',
        })

        pageId = parseInt(pageId.split('_')[1])

        if (window.onbeforeunload) {
          window.onbeforeunload = function () { null; }
        }
        document.location = url.resolveScript({
          //scriptId: 871,
          //deploymentId: 3372,
          scriptId: getParameterFromURL('script'),
          deploymentId: getParameterFromURL('deploy'),
          params: {
            'page': pageId,
          },
        })
      }
      var fldId = context.fieldId



      if (fldId == 'custpage_nameid' || fldId == 'custpage_fromdate' || fldId == 'custpage_todate') {

        var nameId = context.currentRecord.getValue({
          fieldId: 'custpage_nameid',
        })

        var from = context.currentRecord.getValue({
          fieldId: 'custpage_fromdate',
        })
        var formatedFromDate = getFormatedDate(from)
        var to = context.currentRecord.getValue({
          fieldId: 'custpage_todate',
        })
        var formatedToDate = getFormatedDate(to)
        if (window.onbeforeunload) {
          window.onbeforeunload = function () { null; }
        }

        document.location = url.resolveScript({
          //scriptId: 871,
          //deploymentId: 3372,
          scriptId: getParameterFromURL('script'),
          deploymentId: getParameterFromURL('deploy'),
          params: {
            'nameId': nameId,
            'from': formatedFromDate,
            'to': formatedToDate,

          },
        })
      }

    }

    function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
      document.location = url.resolveScript({
        scriptId: suiteletScriptId,
        deploymentId: suiteletDeploymentId,
        params: {
          'page': pageId,
        },
      })
    }

    function getParameterFromURL(param) {
      var query = window.location.search.substring(1)
      var vars = query.split('&')
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=')
        if (pair[0] == param) {
          return decodeURIComponent(pair[1])
        }
      }
      return (false)
    }

    function getFormatedDate(date) {
      var actualdate = new Date(date);
      var day = actualdate.getDate();
      var month = actualdate.getMonth() + 1;
      var year = actualdate.getFullYear();

      if (day < 10) {
        day = '0' + day;
      }
      if (month < 10) {
        month = '0' + month;
      }
      var formatedDate = month + "/" + day + "/" + year;

      return formatedDate
    }


    return {

      fieldChanged: fieldChanged,
      getSuiteletPage: getSuiteletPage,




    }

  })