import json
import numpy as np
from flask import Flask, render_template, request, redirect, Response, jsonify
import pandas as pd
import prince
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)

classofworkers={
		1 :"Employee",
		2 :"NGO",
		3 :"Local government",
		4 :"State government",
		5 :"Federal government",
		6 :"Self-employed" ,
		7 :"Daily Wage"
}

married = {
    1: "Married",
    2: "Widowed",
    3: "Divorced",
    4: "Separated",
    5: "UnMarried"
}


races = {
    1: "White",
    2: "Black",
    3: "American Ind",
    4: "Other",
    5: "Other",
    6: "Asian",
    7: "Other",
    8: "Other",
    9: "Other"
}
degrees = {
    1: "Preschool",
    2: "Preschool",
    3: "Preschool",
    4: "School",
    5: "School",
    6: "School",
    7: "School",
    8: "School",
    9: "School",
    10: "School",
    11: "School",
    12: "School",
    13: "School",
    14: "School",
    15: "School",
    16: "School",
    17: "School",
    18: "School",
    19: "School",
    20: "Bachelors",
    21: "Bachelors",
    22: "Masters",
    23: "Masters",
    24: "Doctorate"
}
employment = {
    1: "Employed",
    2: "Employed",
    3: "Unemployed",
    4: "Armed forces",
    5: "Armed forces",
    6: "Unemployed"
}

@app.route("/", methods = ['POST', 'GET'])
def index():
    return render_template("index.html")

@app.route("/healthCareMap", methods=['GET'])
def getHealthCareDataJson():
    insurancedatadf,wordclouddatadf = GetHealthCareData()
    data = json.dumps(insurancedatadf.to_dict(orient='records'), indent=2)
    label = "Uninsured Population"
    labeljson = json.dumps(label)
    wordclouddata = json.dumps(wordclouddatadf.to_dict(orient='records'), indent=2)
    mapdata = {'mapdata': data,'maplabel':labeljson,'wordclouddata':wordclouddata}
    data = {'healthdata': mapdata}
    return data

@app.route("/econnomicDataMap", methods=['GET'])
def getEconomicDataJson():
    datadf,wordclouddatadf = GetEconomicData()
    data = json.dumps(datadf.to_dict(orient='records'), indent=2)
    label = "Unemployment by State"
    labeljson = json.dumps(label)
    wordclouddata = json.dumps(wordclouddatadf.to_dict(orient='records'), indent=2)
    mapdata = {'mapdata': data,'maplabel':labeljson,'wordclouddata':wordclouddata}
    data = {'economicdata': mapdata}
    return data

@app.route("/immigrationMap", methods=['GET'])
def getImmigrationDataJson():
    datadf,wordclouddatadf = GetImmigrationData()
    data = json.dumps(datadf.to_dict(orient='records'), indent=2)
    label = "Immigrant Population"
    labeljson = json.dumps(label)
    mapdata = {'mapdata': data,'maplabel':labeljson}
    wordclouddata = json.dumps(wordclouddatadf.to_dict(orient='records'), indent=2)
    mapdata = {'mapdata': data,'maplabel':labeljson,'wordclouddata':wordclouddata}
    data = {'immigrationdata': mapdata}
    return data


def GetEconomicData():
	employmentdf = persondatadf.groupby(['ST','ESR'], as_index=False)['PWGTP'].sum()
	employmentdf["Sum"] = employmentdf.groupby('ST')['PWGTP'].transform('sum')
	employmentdf["Percent"] =  (employmentdf["PWGTP"]*100) / employmentdf["Sum"]
	employmentdf = employmentdf[employmentdf.ESR == 3]
	employmentdf.drop(['ESR', 'PWGTP', 'Sum'], axis=1, inplace=True)
	employmentdf['ST'] = employmentdf['ST']*1000
	employmentdf.Percent = employmentdf.Percent.round(2)
	#print(employmentdf.head())
	return employmentdf,wordclouddf_economy

def GetHealthCareData():
	insurancedf = persondatadf.groupby(['ST','HICOV'], as_index=False)['PWGTP'].sum()
	insurancedf["Sum"] = insurancedf.groupby('ST')['PWGTP'].transform('sum')
	insurancedf["Percent"] =  (insurancedf["PWGTP"]*100) / insurancedf["Sum"]
	insurancedf = insurancedf[insurancedf.HICOV != 1]
	insurancedf.drop(['HICOV', 'PWGTP', 'Sum'], axis=1, inplace=True)
	insurancedf['ST'] = insurancedf['ST']*1000
	insurancedf.Percent = insurancedf.Percent.round(2)
	#print(insurancedf.head())
	return insurancedf,wordclouddf_health

def GetImmigrationData():
	immigrationdf = persondatadf.groupby(['ST','CIT'], as_index=False)['PWGTP'].sum()
	immigrationdf["Sum"] = immigrationdf.groupby('ST')['PWGTP'].transform('sum')
	immigrationdf["Percent"] =  (immigrationdf["PWGTP"]*100) / immigrationdf["Sum"]
	immigrationdf = immigrationdf[immigrationdf.CIT == 5]
	immigrationdf.drop(['CIT', 'PWGTP', 'Sum'], axis=1, inplace=True)
	immigrationdf['ST'] = immigrationdf['ST']*1000
	immigrationdf.Percent = immigrationdf.Percent.round(2)
	#print(immigrationdf.head())
	return immigrationdf,wordclouddf_immigration

def applyIncomeCategory(grouped):
    grouped['Income_cat'] = ''
    for idx in range(0, len(grouped)):
      leftBound = grouped.index[idx].left
      if leftBound < 250000:
        grouped['Income_cat'].iloc[idx] = 'Lowest'
      elif leftBound < 500000:
        grouped['Income_cat'].iloc[idx] = 'Lower-mid'
      elif leftBound < 800000:
        grouped['Income_cat'].iloc[idx] = 'Mid'
      elif leftBound < 1050000:
        grouped['Income_cat'].iloc[idx] = 'Upper-mid'
      else:
        grouped['Income_cat'].iloc[idx] = 'Highest'
    return grouped

@app.route("/paracoord", methods=['GET'])
def getParaCoordData():
    global housing
    state = int(request.args.get('state'))

    para = housing[['NPF','WIF', 'VEH', 'NOC', 'FINCP', 'WATP', 'ST']].copy()
    if state > 0:
        para = para[para['ST'] == state]
    para = para[para['FINCP'].notna()]
    para['FINCP_grp'] = pd.cut(para['FINCP'], bins=50)
    grouped = para.groupby('FINCP_grp').agg({'NPF': 'max', 'WIF': 'max','VEH': 'max', 'NOC': 'max',
                                                'WATP': 'max'})
    grouped.dropna(inplace=True)
    grouped = applyIncomeCategory(grouped)
    grouped = grouped[['NPF','WIF', 'VEH', 'NOC', 'WATP', 'Income_cat']]
    grouped.rename(columns={'NPF': 'Persons in family', 'WIF': 'Workers in family',
                        'VEH': 'Vehicles', 'NOC': 'Children in family', 'WATP': 'Water Cost'}, inplace=True)
    return json.dumps(grouped.to_dict('records'))

def peformMCA(state):
    global persondatadf, mca_res
    cat_data = persondatadf[['SCHL', 'RAC1P',  'ESR', 'ST']]

    if state > 0:
        cat_data = cat_data[cat_data['ST'] == state]

    cat_data = cat_data.sample(frac=0.1)
    cat_data.drop(columns="ST", inplace=True)

    cat_data['RAC1P'] = cat_data['RAC1P'].apply(lambda race: races.get(race))
    cat_data['SCHL'] = cat_data['SCHL'].apply(lambda deg: degrees.get(deg))
    cat_data['ESR'] = cat_data['ESR'].apply(lambda emp: employment.get(emp))
    cat_data = cat_data.fillna("Unknown")
    mca = prince.MCA(
         n_components=2,
         n_iter=3,
         copy=True,
         check_input=True,
         engine='auto',
         random_state=42
    )
    mca = mca.fit(cat_data)
    mca_res = mca.column_coordinates(cat_data)
    mca_res.reset_index(inplace=True)
    types = {
        "SCHL": 1,
        "RAC1P": 2,
        "ESR": 3
    }
    mca_res['type'] = mca_res['index'].apply(lambda idx: types.get(idx.split('_')[0]))
    mca_res['index'] = mca_res['index'].apply(lambda idx: idx.split('_')[1])
    mca_res.rename(columns={0: 'x', 1: 'y', index: 'cat'}, inplace=True)

@app.route("/mca", methods=['GET'])
def getMCAData():
    global persondatadf, mca_res
    state = int(request.args.get('state'))
    peformMCA(state)
    return json.dumps(mca_res.to_dict('records'))

def get_key(my_dict, val):
    for key, value in my_dict.items():
         if val == value:
             return key

def getBarChart(state, racesCat, emp, edu):
	global cat_data
	cat_data = persondatadf[['ST','MAR','PWGTP', 'SCHL', 'RAC1P',  'ESR']]
	if state > 0:
		cat_data = cat_data[cat_data['ST'] == state]
		print("st:"+str(cat_data.shape))
	if edu:
		eduKeys = []
		for i in range(0, len(edu)):
			eduKeys.append(get_key(degrees, edu[i]))
		cat_data= cat_data[cat_data.SCHL.isin(eduKeys)]
		print("edu:"+str(cat_data.shape))
	if racesCat:
		raceKeys = []
		for i in range(0, len(racesCat)):
			raceKeys.append(get_key(races, racesCat[i]))
		cat_data= cat_data[cat_data.RAC1P.isin(raceKeys)]
		print("races:"+str(cat_data.shape))
	if emp:
		empKeys = []
		for i in range(0, len(emp)):
			empKeys.append(get_key(employment, emp[i]))
		cat_data= cat_data[cat_data.ESR.isin(empKeys)]
		print("emp:"+str(cat_data.shape))

	cat_data = cat_data[cat_data.MAR <6]
	cat_data.drop(columns=['ST', 'SCHL', 'RAC1P',  'ESR'], inplace=True)
	cat_data.dropna(inplace=True)
	sumvalue = cat_data['PWGTP'].sum()
	cat_data = cat_data.groupby(['MAR'], as_index=False).sum()
	cat_data["Percent"] =  (cat_data["PWGTP"]*100) / sumvalue
	cat_data.Percent = cat_data.Percent.round(2)
	# cat_data['Percent'] = np.log(cat_data['Percent'])
	cat_data['MAR'] = cat_data['MAR'].apply(lambda race: married.get(race))
	cat_data.drop(columns="PWGTP", inplace=True)


@app.route("/barchart", methods=['POST'])
def getBarChartData():
	global cat_data
	req_data = request.get_json()
	state = req_data['state']
	racesCat = req_data['races']
	emp = req_data['emp']
	edu = req_data['edu']
	getBarChart(state, racesCat, emp, edu)
	return json.dumps(cat_data.to_dict('records'))

if __name__ == "__main__":
	global housing
	print("Loading Data...")
	personfields = ["ST", "ESR","PWGTP","HICOV","CIT",'SCHL', 'RAC1P','ESR','HINS4','AGEP','DDRS','COW','PERNP','POVPIP','LANX','NATIVITY', 'MAR']
	housingfields = ["NPF", "WIF", "VEH", "NOC", "FINCP","ST","WATP"]
	housingA = pd.read_csv('static/ss15husa.csv', usecols=housingfields, skipinitialspace = True)
	housingB = pd.read_csv('static/ss15husb.csv', usecols=housingfields, skipinitialspace = True)
	housing = pd.concat([housingA, housingB], ignore_index=True)
	persondata1df=pd.read_csv("static/ss15pusa.csv",skipinitialspace=True, usecols=personfields)
	persondata2df=pd.read_csv("static/ss15pusb.csv",skipinitialspace=True, usecols=personfields)
	persondatadf=pd.concat([persondata1df,persondata2df])
	print("Finished loading data successfully")
	del persondata1df, persondata2df, housingB, housingA
	print("Loading Wordcloud data...")
	wordclouddf_health = persondatadf.groupby(['ST','HICOV','HINS4','DDRS','AGEP'], as_index=False)['PWGTP'].sum()
	wordclouddf_health['SCORE'] = 0
	wordclouddf_health['SCORE'] = wordclouddf_health.apply(lambda row: ((0.5 if row['HICOV'] == 1 else 0) + (0.2 if row['HINS4'] == 1 else 0) + (0.15 if row['DDRS'] == 0 else 0) + (0.15 if row['AGEP'] <40 else 0)), axis=1)
	wordclouddf_health = wordclouddf_health.groupby(['ST'], as_index=False)['SCORE'].mean()
	scaler = MinMaxScaler()
	wordclouddf_health['SCORE'] = scaler.fit_transform(wordclouddf_health['SCORE'].values.reshape(-1,1))

	wordclouddf_economy = persondatadf.groupby(['ST','COW','ESR','PERNP','POVPIP'], as_index=False)['PWGTP'].sum()
	wordclouddf_economy['SCORE'] = 0
	wordclouddf_economy['SCORE'] = wordclouddf_economy.apply(lambda row: ((0.2 if row['COW'] < 8 else 0) + (0 if row['ESR'] == 3 else 0.2) + (0.25 if row['PERNP'] > 50000 else 0) + (0.25 if row['POVPIP'] > 50 else 0)), axis=1)
	wordclouddf_economy = wordclouddf_economy.groupby(['ST'], as_index=False)['SCORE'].mean()
	scaler = MinMaxScaler()
	wordclouddf_economy['SCORE'] = scaler.fit_transform(wordclouddf_economy['SCORE'].values.reshape(-1,1))

	wordclouddf_immigration = persondatadf.groupby(['ST','CIT','LANX','NATIVITY'], as_index=False)['PWGTP'].sum()
	wordclouddf_immigration['SCORE'] = 0
	wordclouddf_immigration['SCORE'] = wordclouddf_immigration.apply(lambda row: ((0 if row['CIT'] == 1 else 0.5) + (0 if row['LANX'] == 2 else 0.2) + (0.3 if row['NATIVITY'] ==2 else 0)), axis=1)
	wordclouddf_immigration = wordclouddf_immigration.groupby(['ST'], as_index=False)['SCORE'].mean()
	scaler = MinMaxScaler()
	wordclouddf_immigration['SCORE'] = scaler.fit_transform(wordclouddf_immigration['SCORE'].values.reshape(-1,1))
	print("Finished loading wordcloud data successfully")
    #peformMCA()
	app.run(debug = False)
