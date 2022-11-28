const wsdlrdr = require('wsdlrdr');

const wsdls = [
	"/beneassicurazioniws/BeneassicurazioniServices?wsdl",
	"/beneassicurazioniwsdir/BeneassicurazioniServices?wsdl",
	"/beneassicurazioniwsportal/BeneassicurazioniServices?wsdl",
	"/wsania/AniaServices?wsdl",
	"/wsjworkflow-jaxws-war/WorkflowServices?wsdl",
	"/wspassanalytics/WspassanalyticsServices?wsdl",
	"/wspasscommon/AdminServices?wsdl",
	"/wspasscommon/AnagServices?wsdl",
	"/wspasscommon/PtfallServices?wsdl",
	"/wspasscommon/SubappServices?wsdl",
	"/wspasscontabilita/BotServices?wsdl",
	"/wspasscreditocauzioni/PasscreditocauzioniServices?wsdl",
	"/wspassfascicolatore-jaxws-war/PassfascicolatoreServices?wsdl",
	"/wspasspro/WspassproServices?wsdl",
	"/wspassptfauto/PassptfautoServices?wsdl",
	"/wspassptfdanni/PtfdanniServices?wsdl",
	"/wspassqq/WspassqqServices?wsdl",
	"/wspasssinistri/SinistriServices?wsdl",
	"/wspasssinistribancadatiisvap/PasssinistribancadatiivassServices?wsdl",
	"/wspasssinistricard/PasssinistricardServices?wsdl",
	"/wspasssinistricoass/SinistricoassServices?wsdl",
	"/wspasssinistricontabilita/PasssinistricontabilitaServices?wsdl",
	"/wssystem/DbfsServices?wsdl",
	"/wssystem/SystemServices?wsdl",
]

const promises = []

wsdls.forEach(wsdl => {
	const params = { host: 'passinsurance-prod.areabene.it', wsdl }
	const options = { secure: true, failOnWrongContentType: true }

	promises.push(wsdlrdr.getAllFunctions(params, options).then(result => {
		return {wsdl, result}
	}))
})

Promise.all(promises).then(funcArray => {
	console.log(funcArray);
})
.catch((err) => {
	throw new Error(err)
});

