/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'],
  function (url, currentRecord) {

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



      if (fldId == 'custpage_nameid' || fldId == 'custpage_pochecknumber') {

        var nameId = context.currentRecord.getValue({
          fieldId: 'custpage_nameid',
        })

        var poCheckNumber = context.currentRecord.getValue({
          fieldId: 'custpage_pochecknumber',
        })

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
            'pochecknumber': poCheckNumber,

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

    return {

      fieldChanged: fieldChanged,
      getSuiteletPage: getSuiteletPage,
     
    }
  })