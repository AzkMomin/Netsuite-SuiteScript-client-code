/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
  'N/search', 'N/record', "N/format"
], function (search, record, format) {

  const getInputData = () => {
    var transactionSearch = search.load({
      id: 'customsearch2977'
    })


    return transactionSearch
  }

  const map = (context) => {
    var commJE_RecResult = JSON.parse(context.value);
    // log.debug('searchResult : ', commJE_RecResult);
    const partner = commJE_RecResult.values["GROUP(custcol_lsk_partner_je_line)"].value;


    // const salesrep = commJE_RecResult.values["GROUP(custcol_amz_sales_rep_partner)"].value;
    context.write({
      key: partner,
      value: {
        invId: commJE_RecResult.values["GROUP(internalid.CUSTBODY_AMZ_INVOICE_NUM)"].value,
        JE_ID: commJE_RecResult.values["GROUP(internalid)"].value,
        creditAmt: commJE_RecResult.values["AVG(formulacurrency)"],
        commTypeSplit: commJE_RecResult.values["GROUP(custbody_split_commissions.CUSTBODY_AMZ_INVOICE_NUM)"],
        date: commJE_RecResult.values["GROUP(trandate)"]
      }
    });


  }
  const reduce = (context) => {
    var partnerID = context.key
    log.debug('partnerID : ',partnerID)
    var records = context.values

    var commAmount = 0;
    var linkApplyToCommJE = []
    var linkApplyToInv = []
    var date;
    // log.debug("salesrepId ", salesrepId)
    // log.debug("records ", records)
    records.forEach((result) => {
      var resultObj = JSON.parse(result);
      commAmount += Number(resultObj.creditAmt)
      linkApplyToCommJE.push(resultObj.JE_ID);
      linkApplyToInv.push({
        invId: resultObj.invId,
        isSplitComm: resultObj.commTypeSplit
      });
      date = resultObj.date
    })

    commAmount = commAmount.toFixed(2)
    log.debug('commAmount : ', commAmount)
    log.debug('date : ', date)
    // log.debug('linkApplyToCommJE : ', linkApplyToCommJE)

    var partnerAccumulatedComm = getPartnerAccumulatedComm(partnerID);
    log.debug('partnerAccumulatedComm : ', partnerAccumulatedComm)
    var prevPartnerRec = getPreviousPartnerRecord(partnerID)
    log.debug('prevPartnerRec : ', prevPartnerRec)

    const person = {
      id: partnerID,
      monthComm: commAmount,
      commJE_ID: linkApplyToCommJE,
      invId: linkApplyToInv,
      accuCommObj: partnerAccumulatedComm,
      prevRec: prevPartnerRec,
      date: date
    }
    log.debug("person ", person)
    const commRec = createCommRecord(person);

  }
  const createCommRecord = (person) => {
    try {
      var commRec;
      if (person.prevRec.isFound) {
        log.debug("Previous rec found with ID : ", person.prevRec.prevCommRecId)
        commRec = record.load({
          type: 'customrecord921',
          id: person.prevRec.prevCommRecId,
          isDynamic: true
        });
      }
      else {
        log.debug("Previous rec not found: ")
        commRec = record.create({
          type: 'customrecord921',
          isDynamic: true
        });
      }

      var partner_salesrep = "custrecord_amz_dfs_com_partner";

      var date = new Date(person.date);
      var month = date.getMonth() + 1;
      log.debug("Current Month Number : ", month);
      //Setting partner or emp field
      commRec.setValue({ fieldId: partner_salesrep, value: person.id });
      //setting month date means script will run on month date i.e todays date
      commRec.setValue({
        fieldId: "custrecord_amz_dfs_com_date",
        value: format.parse({
          value: date,
          type: format.Type.DATE
        })
      });
      //settin current month
      commRec.setValue({ fieldId: "custrecord_lsk_comm_month", value: month });

      //Setting Monthly commission
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_month_comm", value: person.monthComm });
      var fieldLookUp = search.lookupFields({
        type: 'employee',
        id: person.id,
        columns: ['custentity_dfs_guarantee_pay']
      });

      var anualGuarenteeComm = parseFloat(fieldLookUp.custentity_dfs_guarantee_pay);

      // log.debug("anual gaurentee commission : ", anualGuarenteeComm);

      var accumulatedComm = parseFloat(person.monthComm);
      if (person.accuCommObj.isFound) {
        accumulatedComm += parseFloat(person.accuCommObj.accuComm);
      }

      // log.debug("accumulated commission : ", accumulatedComm);

      //Setting accumulated commission field
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_acc_comm", value: accumulatedComm });

      //Setting annual guarentee field
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_grantee", value: anualGuarenteeComm });

      var monthlyGuarenteeComm = parseFloat(anualGuarenteeComm) / 12;

      let monthlyPayables = monthlyGuarenteeComm
      if (accumulatedComm > anualGuarenteeComm) {
        monthlyPayables += person.monthComm
      }
      // Setting Monthly guarentee commission
      // log.debug("monthly Guarentee commission : ", monthlyGuarenteeComm);
      commRec.setValue({ fieldId: "custrecord_lsk_monthlyguaranteedcomm", value: monthlyGuarenteeComm });


      // Setting Monthly Payables
      // log.debug("monthlyPayables commission : ", monthlyPayables);
      commRec.setValue({ fieldId: "custrecord_amz_monthly_commission", value: monthlyPayables });

      var commRecSavedID = commRec.save();
      log.debug("Commission record created/updated successfrully for", commRecSavedID)


      person.commJE_ID.forEach((result) => {
        var CommJE_Rec = record.load({
          type: "customtransaction_amz_commission",
          id: result,
        })

        var lineNumber = CommJE_Rec.findSublistLineWithValue({
          sublistId: 'line',
          fieldId: 'custcol_amz_sales_rep_partner',
          value: person.id
        });

        CommJE_Rec.setSublistValue("line", "custcol_lsk_comm_record_jelink", lineNumber, commRecSavedID);
        var commJEID = CommJE_Rec.save();
        log.debug("Link updated on commission JE id  : ", commJEID)
      })


      person.invId.forEach((result) => {
        var invFields = search.lookupFields({
          type: "invoice",
          id: result.invId,
          columns: ['custbodydfs_salesrep1_', "custbodydfs_salesrepb_", 'custbodydfs_partnera_', 'custbodydfs_partnerb_'] //"custentity31", "custentity32", "custentity33"
        });

        if (result.isSplitComm == "F") {
          var otherId = record.submitFields({
            type: 'invoice',
            id: result.invId,
            values: {
              'custbody_lsk_commrecord_link': commRecSavedID
            }
          });
          log.debug("Link updated on Invoice id  : ", otherId)
        } else {
          if (invFields.custbodydfs_partnera_ != "" && invFields.custbodydfs_partnera_[0].value == person.id) {
            // log.debug(" SalesRep A : ", invFields.custbodydfs_salesrep1_)
            var otherId = record.submitFields({
              type: 'invoice',
              id: result.invId,
              values: {
                "custbody_lsk_partnerlink_1": commRecSavedID
              }
            });
            log.debug("Link updated on Invoice id  : ", otherId)
          }
          else if (invFields.custbodydfs_partnerb_ != "" && invFields.custbodydfs_partnerb_[0].value == person.id) {
            // log.debug(" SalesRep  : ", invFields.custbodydfs_salesrepb_)
            var otherId = record.submitFields({
              type: 'invoice',
              id: result.invId,
              values: {
                "custbody_lsk_partnerlink_2": commRecSavedID
              }
            });
            log.debug("Link updated on Invoice id  : ", otherId)
          }
        }
      })

    }
    catch (e) {
      log.debug("error", e)
    }
  }

  const getPartnerAccumulatedComm = (partnerId) => {
    var obj;
    const customrecord_commissionsSearchColEmployee = search.createColumn({ name: 'custrecord_amz_dfs_com_emp', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColPartner = search.createColumn({ name: 'custrecord_amz_dfs_com_partner', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColAccumulatedCommission = search.createColumn({ name: 'custrecord_amz_dfs_com_acc_comm', summary: search.Summary.SUM });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord921',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'lastmonth'],
        'AND',
        ['custrecord_amz_dfs_com_partner', 'anyof', String(partnerId)],
        'AND',
        ['custrecord_amz_dfs_com_date', 'within', 'thisfiscalyear'],
      ],
      columns: [
        customrecord_commissionsSearchColEmployee,
        customrecord_commissionsSearchColPartner,
        customrecord_commissionsSearchColAccumulatedCommission,
      ],
    });

    const customrecord_commissionsSearchPagedData = customrecord_commissionsSearch.runPaged({ pageSize: 1000 });

    if (customrecord_commissionsSearchPagedData.pageRanges.length != 0) {
      for (let i = 0; i < customrecord_commissionsSearchPagedData.pageRanges.length; i++) {
        const customrecord_commissionsSearchPage = customrecord_commissionsSearchPagedData.fetch({ index: i });
        customrecord_commissionsSearchPage.data.forEach((result) => {
          const employee = result.getValue(customrecord_commissionsSearchColEmployee);
          const partner = result.getValue(customrecord_commissionsSearchColPartner);
          const accumulatedCommission = result.getValue(customrecord_commissionsSearchColAccumulatedCommission);

          obj = {
            isFound: true,
            accuComm: accumulatedCommission
          }
        });
      }
    }
    else {
      obj = {
        isFound: false,
      }
    }

    return obj;
  }
  const getPreviousPartnerRecord = (partnerId) => {
    var found;
    const customrecord921SearchColScriptId = search.createColumn({ name: 'scriptid', sort: search.Sort.ASC });
    const customrecord921SearchColInternalId = search.createColumn({ name: 'internalid' });
    const customrecord921Search = search.create({
      type: 'customrecord921',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'thismonth'],
        'AND',
        ['custrecord_amz_dfs_com_partner', 'anyof', String(partnerId)],
      ],
      columns: [
        customrecord921SearchColScriptId,
        customrecord921SearchColInternalId,
      ],
    });
    // Note: Search.run() is limited to 4,000 results
    // customrecord_commissionsSearch.run().each((result: search.Result): boolean => {
    //   return true;
    // });
    const customrecord_commissionsSearchPagedData = customrecord921Search.runPaged({ pageSize: 1000 });
    log.debug("customrecord_commissionsSearchPagedData.pageRanges.length", customrecord_commissionsSearchPagedData.pageRanges.length)
    if (customrecord_commissionsSearchPagedData.pageRanges.length != 0) {
      for (let i = 0; i < customrecord_commissionsSearchPagedData.pageRanges.length; i++) {
        const customrecord_commissionsSearchPage = customrecord_commissionsSearchPagedData.fetch({ index: i });
        customrecord_commissionsSearchPage.data.forEach((result) => {
          const id = result.getValue(customrecord921SearchColInternalId);
          const scriptId = result.getValue(customrecord921SearchColScriptId);

          found = {
            isFound: true,
            prevCommRecId: id
          }
        });
      }
    } else {
      found = {
        isFound: false,
      }
    }

    return found;
  }

  return {
    getInputData,
    map,
    reduce
  }

});