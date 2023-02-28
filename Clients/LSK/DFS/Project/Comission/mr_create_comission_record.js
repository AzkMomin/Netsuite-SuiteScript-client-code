/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
  'N/search', 'N/record', "N/format"
], function (search, record, format) {

  const getInputData = () => {
    //saved search which lists out the invoices where delta dollars are used

    const transactionSearchColInternalId = search.createColumn({ name: 'internalid', summary: search.Summary.GROUP });
    const transactionSearchColSalesReppartner = search.createColumn({ name: 'custcol_amz_sales_rep_partner', summary: search.Summary.GROUP });
    const transactionSearchColPartner = search.createColumn({ name: 'custcol_lsk_partnerjecol', summary: search.Summary.GROUP });
    const transactionSearchColAmountCredit = search.createColumn({ name: 'creditamount', summary: search.Summary.SUM });
    const transactionSearch = search.create({
      type: 'transaction',
      filters: [
        ['type', 'anyof', 'Custom100'],
        'AND',
        ['creditamount', 'isnotempty', ''],
        'AND',
        ['trandate', 'within', '11/1/2022', '1/31/2023'],

      ],
      columns: [
        transactionSearchColInternalId,
        transactionSearchColSalesReppartner,
        transactionSearchColPartner,
        transactionSearchColAmountCredit,
      ],
    });
    return transactionSearch
  }

  const map = (context) => {
    var commJE_RecResult = JSON.parse(context.value);
    // log.debug('searchResult : ', commJE_RecResult)
    const salesrep = commJE_RecResult.values["GROUP(custcol_amz_sales_rep_partner)"].value;
    const partner = commJE_RecResult.values["GROUP(custcol_lsk_partnerjecol)"].value;

    if (partner != undefined) {
      var partnerAccumulatedComm = getPartnerAccumulatedComm(partner);
      var prevPartnerRec = getPreviousPartnerRecord(partner)
      log.debug("partner : ", partner)
      const person = {
        person: "partner",
        id: commJE_RecResult.values["GROUP(custcol_lsk_partnerjecol)"].value,
        monthComm: parseFloat(commJE_RecResult.values["SUM(creditamount)"]),
        commJE_ID: commJE_RecResult.values["GROUP(internalid)"].value,
        accuCommObj: partnerAccumulatedComm,
        prevRec: prevPartnerRec

      }
      log.debug(":person : ", person);
      // const commRec = createCommRecord(person);
    }
    else {
     
        log.debug("salesrep : ", salesrep);
        var salesrepAccumulatedComm = getSalesrepAccumulatedComm(salesrep);
        var prevSalesRepRec = getPreviousSalesRepRecord(salesrep)
        const person = {
          person: "employee",
          id: commJE_RecResult.values["GROUP(custcol_amz_sales_rep_partner)"].value,
          monthComm: parseFloat(commJE_RecResult.values["SUM(creditamount)"]),
          commJE_ID: commJE_RecResult.values["GROUP(internalid)"].value,
          accuCommObj: salesrepAccumulatedComm,
          prevRec: prevSalesRepRec

        }
        log.debug(":person : ", person);


        const commRec = createCommRecord(person);
      
    }
  }
  const createCommRecord = (person) => {
    try {
      var commRec;
      if (person.prevRec.isFound) {
        log.debug("Previous rec found with ID : ", person.prevRec.prevCommRecId)
        commRec = record.load({
          type: 'customrecord_commissions',
          id: person.prevRec.prevCommRecId,
          isDynamic: true
        });
      }
      else {
        log.debug("Previous rec not found: ")
        commRec = record.create({
          type: 'customrecord_commissions',
          isDynamic: true
        });
      }

      var partner_salesrep;
      if (person.person == "partner") {
        partner_salesrep = "custrecord_amz_dfs_com_partner";
      } else {
        partner_salesrep = "custrecord_amz_dfs_com_emp";
      }

      log.debug("partner or commission : ", partner_salesrep);

      var todysDate = new Date();
      var month = todysDate.getMonth() + 1;
      // log.debug("Current Month Number : ", month);
      //Setting partner or emp field
      commRec.setValue({ fieldId: partner_salesrep, value: person.id });
      //setting month date means script will run on month date i.e todays date
      commRec.setValue({
        fieldId: "custrecord_amz_dfs_com_date",
        value: format.parse({
          value: todysDate,
          type: format.Type.DATE
        })
      });
      //settin current month
      commRec.setValue({ fieldId: "custrecord_comm_month", value: month });

      //Setting Monthly commission
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_month_comm", value: person.monthComm });
      var fieldLookUp = search.lookupFields({
        type: person.person,
        id: person.id,
        columns: ['custentity_dfs_guarantee_pay']
      });

      var anualGuarenteeComm = parseFloat(fieldLookUp.custentity_dfs_guarantee_pay);

      log.debug("anual gaurentee commission : ", anualGuarenteeComm);

      var accumulatedComm = parseFloat(person.monthComm);
      if (person.accuCommObj.isFound) {
        accumulatedComm += parseFloat(person.accuCommObj.accuComm);
      }


      log.debug("accumulated commission : ", accumulatedComm);

      //Setting accumulated commission field
      commRec.setValue({ fieldId: "custrecord_amz_dfs_com_acc_comm", value: accumulatedComm });

      //Setting annual guarentee field
      commRec.setValue({ fieldId: "custrecord_lsk_agcomm", value: anualGuarenteeComm });

      var monthlyGuarenteeComm = parseFloat(anualGuarenteeComm) / 12;

      let monthlyPayables = monthlyGuarenteeComm
      if (accumulatedComm > anualGuarenteeComm) {
        monthlyPayables += person.monthComm
      }
      // Setting Monthly guarentee commission
      log.debug("monthly Guarentee commission : ", monthlyGuarenteeComm);
      commRec.setValue({ fieldId: "custrecord_lsk_monthlyguaranteedcomm", value: monthlyGuarenteeComm });


      // Setting Monthly Payables
      log.debug("monthlyPayables commission : ", monthlyPayables);
      commRec.setValue({ fieldId: "custrecord_amz_monthly_commission", value: monthlyPayables });

      var commRecSavedID = commRec.save();
      log.debug("Commission record created/updated successfrully for", commRecSavedID, person.person)

      var CommJE_Rec = record.load({
        type: "customtransaction_amz_commission",
        id: person.commJE_ID,
        isDynamic: true
      })
      var commJE_lineCount = CommJE_Rec.getLineCount({ sublistId: "line" });
      log.debug("commJE_lineCount : ", commJE_lineCount);
      if (person.person == "partner") {
        for (var i = 0; i < commJE_lineCount; i++) {
          CommJE_Rec.selectLine("line", i);
          var partner = CommJE_Rec.getCurrentSublistValue("line", "custcol_lsk_partnerjecol");
          if (partner == person.id) {
            log.debug("partner id found", partner);
            CommJE_Rec.setCurrentSublistValue("line", "custcol_lsk_commissionslinkje", commRecSavedID);
            CommJE_Rec.commitLine("line");
          }
        }
      } else {
        for (var i = 0; i < commJE_lineCount; i++) {
          CommJE_Rec.selectLine("line", i);
          var salesrep = CommJE_Rec.getCurrentSublistValue("line", "custcol_amz_sales_rep_partner");
          if (salesrep == person.id) {
            log.debug("salesrep id found", salesrep);
            CommJE_Rec.setCurrentSublistValue("line", "custcol_lsk_commissionslinkje", commRecSavedID);
            CommJE_Rec.commitLine("line");
          }
        }
      }
      var commJEID = CommJE_Rec.save();
      log.debug("Link updated on commission JE id  : ", commJEID)

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
      type: 'customrecord_commissions',
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
    if (customrecord_commissionsSearchPagedData.pageRanges.length !== 0) {
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

  const getSalesrepAccumulatedComm = (salesrepId) => {
    var obj;
    const customrecord_commissionsSearchColEmployee = search.createColumn({ name: 'custrecord_amz_dfs_com_emp', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColPartner = search.createColumn({ name: 'custrecord_amz_dfs_com_partner', summary: search.Summary.GROUP });
    const customrecord_commissionsSearchColAccumulatedCommission = search.createColumn({ name: 'custrecord_amz_dfs_com_acc_comm', summary: search.Summary.SUM });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord_commissions',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'lastmonth'],
        'AND',
        ['custrecord_amz_dfs_com_emp', 'anyof', salesrepId],
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
    const customrecord_commissionsSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
    const customrecord_commissionsSearchColScriptId = search.createColumn({ name: 'scriptid' });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord_commissions',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'thismonth'],
        'AND',
        ['custrecord_amz_dfs_com_partner', 'anyof', partnerId],
      ],
      columns: [
        customrecord_commissionsSearchColId,
        customrecord_commissionsSearchColScriptId,
      ],
    });
    // Note: Search.run() is limited to 4,000 results
    // customrecord_commissionsSearch.run().each((result: search.Result): boolean => {
    //   return true;
    // });
    const customrecord_commissionsSearchPagedData = customrecord_commissionsSearch.runPaged({ pageSize: 1000 });
    if (customrecord_commissionsSearchPagedData.pageRanges.length != 0) {
      for (let i = 0; i < customrecord_commissionsSearchPagedData.pageRanges.length; i++) {
        const customrecord_commissionsSearchPage = customrecord_commissionsSearchPagedData.fetch({ index: i });
        customrecord_commissionsSearchPage.data.forEach((result) => {
          const id = result.getValue(customrecord_commissionsSearchColId);
          const scriptId = result.getValue(customrecord_commissionsSearchColScriptId);

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
  const getPreviousSalesRepRecord = (salesrepId) => {
    var found;
    const customrecord_commissionsSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
    const customrecord_commissionsSearchColScriptId = search.createColumn({ name: 'scriptid' });
    const customrecord_commissionsSearch = search.create({
      type: 'customrecord_commissions',
      filters: [
        ['custrecord_amz_dfs_com_date', 'within', 'thismonth'],
        'AND',
        ['custrecord_amz_dfs_com_emp', 'anyof', salesrepId],
      ],
      columns: [
        customrecord_commissionsSearchColId,
        customrecord_commissionsSearchColScriptId,
      ],
    });

    const customrecord_commissionsSearchPagedData = customrecord_commissionsSearch.runPaged({ pageSize: 1000 });
    if (customrecord_commissionsSearchPagedData.pageRanges.length != 0) {
      for (let i = 0; i < customrecord_commissionsSearchPagedData.pageRanges.length; i++) {
        const customrecord_commissionsSearchPage = customrecord_commissionsSearchPagedData.fetch({ index: i });
        customrecord_commissionsSearchPage.data.forEach((result) => {
          const id = result.getValue(customrecord_commissionsSearchColId);
          const scriptId = result.getValue(customrecord_commissionsSearchColScriptId);

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

    return found
  }

  return {
    getInputData,
    map
  }

});