var fs = require('fs');
var util = require('util');
var stream = require('stream');
var es = require('event-stream');
var unzip = require('unzip');
var deltaError = require('./helper/deltaHelper.js');
var productFull = require('./helper/product_full.js');
var prodInCat = require('./helper/product_in_category.js');
var categoryFull = require('./helper/category_full.js');
var fileName = "\/" + process.argv[2];
var delim = process.argv[3];
var dirPath = __dirname;
var rowCountPf = 1;
var rowCountPic = 1;
var rmdir = require('rmdir');
var productIds;
var categories;

console.log(dirPath + "\/" + process.argv[2].slice(0, -4) + "\/");

if(process.argv[2].indexOf('zip') > -1){

	fs.createReadStream(dirPath + fileName)
		.pipe(unzip.Extract({path: dirPath + "\/" + process.argv[2].slice(0, -4)}))
		.on('error', function(){
			throw new Error(error);
		})
		.on('close', function(){
			console.log('Done extracting files');

			fs.readdir(dirPath + fileName.slice(0, -4) + "\/", function(err, files){

				if (err){
					console.log('Unzipped Successfully');
					throw new Error(err);
				}else{
					// console.log(files);
					validate(files);
				}
			});
		});
}

function validate(files){
	console.log(files);
	for(i=0; i < files.length; i++){
		// console.log(dirPath+fileName.slice(0, -4)+"\/"+files[i]);

		if(files[i].slice(0,12) === 'product_full'){
			product_Full(files[i], files);
		}

		// if (i === files.length-1){
		// 	console.log('Delete Process Started');
		// 	rmdir(dirPath + fileName.slice(0, -4), function (err, dirs, files) {
		// 		if (err) { console.log(err)};
		// 		console.log('Reached Delete Process');
		// 	  console.log(dirs);
		// 	  console.log(files);
		// 	  console.log('all files are removed');
		// 	});
		// }
	// console.time('Validation Excuted In');
	//Validation Process
	// var s = fs.createReadStream(dirPath+fileName+"\/"+files[0])
	// 	.pipe(es.split())
	// 	//.pipe(es.parse({error:true}))
	// 	.pipe(es.mapSync(function(line){
	// 		s.pause();

	// 		if (rowCount === 1){
	// 			deltaError.productHeaderCheck(line.split(delim));
	// 		}

	// 		deltaError.rowMergeCheck(line, rowCount, delim);
	// 		deltaError.rowLengthCheck(line, rowCount, delim);

	// 		rowCount++;

	// 		s.resume();
	// 	})
	// 	.on('error', function(){
	// 		console.log('Error while reading file');
	// 	})
	// 	.on('end', function(){
	// 		console.log('Read entire file.\n');

	// 		deltaError.printLog(rowCount);

	// 		console.timeEnd('Validation Excuted In');
	// 	})
	// );
	}
}

function product_Full(file, files){
	console.time('Product Full Validation Excuted In');
	//Validation Process
	var s = fs.createReadStream(dirPath+fileName.slice(0, -4)+"\/"+file)
		.pipe(es.split())
		//.pipe(es.parse({error:true}))
		.pipe(es.mapSync(function(line){
			s.pause();

			productFull.rowCheck(line, rowCountPf,delim);

			rowCountPf++;

			s.resume();
		})
		.on('error', function(){
			console.log('Error while reading file Product Full');
		})
		.on('end', function(){
			console.log('Read entire file.\n');

			productFull.printLog(rowCountPf);
			productIds = productFull.retrieveAllProductIds();

			// console.log(productIds);

			console.timeEnd('Product Full Validation Excuted In');

			for(var i = 0; i < files.length; i++)
			{
				if(files[i].slice(0,19) === 'product_in_category'){
					product_In_Category(files[i], productIds);
				}
			}
		})
	);
}

function product_In_Category(file, productIds, files){
	console.time('Product In Category Validation Excuted In');
	// console.log("ProductIDs: " + productIds);
	//Validation Process
	var s = fs.createReadStream(dirPath+fileName.slice(0, -4)+"\/"+file)
		.pipe(es.split())
		//.pipe(es.parse({error:true}))
		.pipe(es.mapSync(function(line){
			s.pause();

			prodInCat.rowCheck(line,rowCountPic,delim,productIds);

			rowCountPic++;

			s.resume();
		})
		.on('error', function(){
			console.log('Error while reading file Product in Category');
		})
		.on('end', function(){
			console.log('Read entire file.\n');

			prodInCat.printLog(rowCountPic);
			// productIds = prodInCat.retrieveAllProductIds();

			deleteFile();

			console.timeEnd('Product In Category Validation Excuted In');
		})
	);
}

function category_Full(file) {
    console.time('\n\n\n --- [INFO] --- Entering category_Full function');
    var errorLog = [];

    for (var i = 0; i < 2; i++) {
        validateCategoryFull(file, errorLog, i);
    }

}

function validateCategoryFull(file, errorLog, runNumber) {
    //Validation Process

    var index = 0;

    var s = fs.createReadStream(dirPath + fileName.slice(0, -4) + "\/" + file)
        .pipe(es.split())
        //.pipe(es.parse({error:true}))
        .pipe(es.mapSync(function (line) {
                s.pause();

                if (line !== "" && index === 0 && runNumber === 0) {
                    categoryFull.checkCategoryHeader(line, delim);
                } else if (line !== "" && index > 0 && runNumber === 0) {
                    categoryFull.extractCategoryIds(index - 1, line, delim);
                    categories = categoryFull.getAllCategoryIds();
                } else if (line !== "" && index > 0 && runNumber === 1) {
                    categoryFull.runChecks(index, line, delim);
                    categoryFullRowCount++;
                }

                index++;

                s.resume();
            })
            .on('error', function () {
                console.log('\n\n\n [Category Full] - Error while reading file');
            })
            .on('end', function () {
                /*productFull.printLog(rowCount);*/

                /*console.timeEnd('Validation Excuted In');*/
                if (runNumber === 1) {
                    console.log('\n\n\n[Category Full] Read entire categoryFull file.\n');
                    console.log("\n\n\n[Category Full] " + categoryFull.getErrorMessage());

                    console.log("\n-- WARNING -- [Category Full] Duplicate categories:" + categoryFull.getDuplicateCategories());
                }
            })
        );

function deleteFile(){
	rmdir(dirPath + fileName.slice(0, -4), function (err, dirs, files) {
		if (err) { console.log(err)};
		console.log('Reached Delete Process');
		console.log(dirs);
		console.log(files);
		console.log('All the files are removed');
		return true;
	});
	// console.log("This is the Delete File function for file: " + );
}