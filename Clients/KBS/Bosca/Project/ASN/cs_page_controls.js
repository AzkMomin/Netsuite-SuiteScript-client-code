  /**
   * @NApiVersion 2.1
   * @NScriptType ClientScript
   */
  define(['N/url', 'N/search', 'N/currentRecord'],
    function (url, search, currentRecord) {
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
        
        if (fldId == 'custpage_companyname' || fldId == 'custpage_pochecknumber' || fldId == 'custpage_shippingaddress' || fldId == 'custpage_actualshipdate'|| fldId == 'custpage_from' || fldId == 'custpage_to') {
          
          var companyName = context.currentRecord.getValue({
            fieldId: 'custpage_companyname',
          })
    
          var poCheckNumber = context.currentRecord.getValue({
            fieldId: 'custpage_pochecknumber',
          })
          var shipAddress = context.currentRecord.getValue({
            fieldId: 'custpage_shippingaddress',
          })
          var actualShipDate = context.currentRecord.getValue({
            fieldId: 'custpage_actualshipdate',
          })
          var actualFormatedShipDate = getFormatedDate(actualShipDate)
    
          var from = context.currentRecord.getValue({
            fieldId: 'custpage_from',
          })
          var formatedFromDate = getFormatedDate(from)
          
          var to = context.currentRecord.getValue({
            fieldId: 'custpage_to',
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
              'companyname': companyName,
              'pochecknumber': poCheckNumber,
              'shipaddress': shipAddress,
              'actualshipdate': actualFormatedShipDate,
              'from': formatedFromDate,
              'to': formatedToDate,
            },
          })
        }

      }

      function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
        // var url = "https://1232017-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=579&deploy=1&compid=1232017_SB1&compid=1232017_SB1&packageSource=3&params1=1084267&id=1084267&internalId=${internalId}&whence=";

        // httpRequest = (url, method = 'GET') => {
        //   return new Promise((resolve, reject) => {
        //     const xhr = new XMLHttpRequest();
        //     xhr.open(method, url);
        //     xhr.onload = () => {
        //       if (xhr.status === 200) { 
        //         log.debug('HTML : '+xhr.responseText)
        //         resolve(xhr.responseText); }
        //       else { 
        //         log.debug('Error : '+xhr.responseText)
        //         reject(new Error(xhr.responseText)); }
        //     };
        //     xhr.send();
        //   });
        // }
        var url2 = `https://1232017-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=579&deploy=1&compid=1232017_SB1&compid=1232017_SB1&packageSource=3&params1=1084267&id=1084267&internalId=798088&whence=`

        window.open(url2, 'ASN Popup')

        // document.location = url.resolveScript({
        //   scriptId: suiteletScriptId,
        //   deploymentId: suiteletDeploymentId,
        //   params: {
        //     'page': pageId,
        //   },
        // })
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
      function getFormatedDate(date){
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