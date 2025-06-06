const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const path = require('path');
const fs = require('fs');


const uploadDir = path.join(__dirname, 'uploads');

// Tạo thư mục uploads nếu chưa có
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const validType = function(value, type, length = 1) {
  let minLength = 0;
  if (length !== null && length !== undefined) {
    minLength = length;
  }
  return !(typeof value !== type || value == null || value.length < minLength);
};
let maxSize = parseInt(global.INFO.setting['MAX_UPLOAD_OTHER_SIZE'], 10);


class RenameOnCompleteStore extends FileStore {
  async write(req, id, offset) {
    const newOffset = await super.write(req, id, offset);
    const upload = await this.getUpload(id);
    if (upload.offset === upload.size) {
      // Upload is complete!
      const filename = upload.metadata.filename;
      if (!validType(filename, 'string') || filename.length < 5 || filename.length > 1024) {
        fs.unlinkSync(path.join(this.directory, id));
        console.error(`❌ Invalid filename length for ID: ${id}`, filename);
        throw new Error('Invalid filename length');
        // delete upload;
       
      }
      let fileFormat = ext.toUpperCase();
      const objFileInfo = pieces.findInArrayBy2PropSafe(
          constant.ALLOWED_ALL_MIMETYPE_ENUM,
          'ext', fileFormat,
          'mimetype', mimetype
        );
      console.log(`Upload complete for ID: ${id}`, filename);
      if (!objFileInfo) {
        console.error(`❌ Unsupported file format for ID: ${id}`, fileFormat, mimetype);
        fs.unlinkSync(path.join(this.directory, id));
        throw new Error('Unsupported file format');
      }
      const type = objFileInfo.type;

      const licenseCheck = {
        AUDIO: 'ENABLE_TYPE_AUDIO',
        VIDEO: 'ENABLE_TYPE_VIDEO',
        IMAGE: 'ENABLE_TYPE_IMAGE',
        DOCUMENT: 'ENABLE_TYPE_DOCUMENT',
        [constant.ASSET_TYPE_ENUM.OTHER]: 'ENABLE_TYPE_3D',
      };
      const licenseKey = licenseCheck[type] || 'ENABLE_TYPE_3D';
      const licenseSetting = global.INFO.setting ?? {};

      const isEnabled = parseInt(licenseSetting[licenseKey] || '0') !== 0;
      if (!isEnabled) {
        console.error(`🚫 ${type} not allowed by license for ID: ${id}`, fileFormat, mimetype);
        fs.unlinkSync(path.join(this.directory, id));
        throw new Error('File type not allowed by license');
      }
      const maxSizeListCode = {
        AUDIO: 'MAX_UPLOAD_AUDIO_SIZE',
        VIDEO: 'MAX_UPLOAD_VIDEO_SIZE',
        IMAGE: 'MAX_UPLOAD_IMAGE_SIZE',
        DOCUMENT: 'MAX_UPLOAD_DOCUMENT_SIZE',
        [constant.ASSET_TYPE_ENUM.OTHER]: 'MAX_UPLOAD_OTHER_SIZE',
      }
      const maxSizeCode = maxSizeListCode[type] || 'MAX_UPLOAD_OTHER_SIZE';
      const maxSize = parseInt(licenseSetting[maxSizeCode], 10);
      if (upload.size > maxSize) {
        console.error(`❌ File size exceeds limit for ID: ${id}`, upload.size, maxSize);
        fs.unlinkSync(path.join(this.directory, id));
        throw new Error('File size exceeds limit');
      }


      const oldPath = path.join(this.directory, id);
      const newPath = path.join(this.directory, filename);
      console.log(`Renaming from ${oldPath} to ${newPath}`);
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed ${id} -> ${filename}`);
      }

      // call post request to update file info
      // https://webhook.site/520f1866-ebf9-47c3-82a4-f15dd227aa63
      const body = {
      
      }
    }

    return newOffset;
  }
  
}

function customFileFilter(originalName, mimetype, ext) {


  const objFileInfo = pieces.findInArrayBy2PropSafe(
    constant.ALLOWED_ALL_MIMETYPE_ENUM,
    'ext', fileFormat,
    'mimetype', mimetype
  );

  if (!objFileInfo) {
    myLogger.info('Format not supported:', fileFormat, mimetype);
    return false;
  }

  const licenseSetting = global.INFO.setting ?? {};
  const type = objFileInfo.type;

  const licenseCheck = {
    AUDIO: 'ENABLE_TYPE_AUDIO',
    VIDEO: 'ENABLE_TYPE_VIDEO',
    IMAGE: 'ENABLE_TYPE_IMAGE',
    DOCUMENT: 'ENABLE_TYPE_DOCUMENT',
    [constant.ASSET_TYPE_ENUM.OTHER]: 'ENABLE_TYPE_3D',
  };

  const licenseKey = licenseCheck[type] || 'ENABLE_TYPE_3D';
  const isEnabled = parseInt(licenseSetting[licenseKey] || '0') !== 0;

  if (!isEnabled) {
    myLogger.info(`🚫 ${type} not allowed by license`);
    return false;
  }
  
  return true;
}


// Tạo TUS server với FileStore
const tus = new Server({
  path: '/files',
  datastore: new RenameOnCompleteStore({ directory: uploadDir }),
});

// export 
module.exports = tus;

const fileFilter = (req, file, callback) => {
	// callback(new Error('audio file is not allowed by license'), false);
	// return;
	if (!verifyData.validType(file.originalname, 'string') || file.originalname.length < 5 || file.originalname.length > 1024) {
		callback(null, false);
		return;
	}
	req.body.type = constant.ASSET_TYPE_ENUM.NONE;
	req.body.extension = path.extname(file.originalname);
	let fileFormat = '';
	// just get extension without .
	if (req.body.extension) {
		const tmp = req.body.extension.slice(1);
		req.body.extension = tmp.toLowerCase();
		fileFormat = tmp.toUpperCase();
	}

	const objFileInfo = pieces.findInArrayBy2PropSafe(constant.ALLOWED_ALL_MIMETYPE_ENUM, 'ext', fileFormat, 'mimetype', file.mimetype);
	myLogger.info(fileFormat + file.mimetype);
	if (objFileInfo) {
		req.body.type = objFileInfo.type;
		switch (objFileInfo.type) {
			case constant.ASSET_TYPE_ENUM.AUDIO:
				const licenseUseTypeAudioAllow = global.INFO.setting?.['ENABLE_TYPE_AUDIO'] ? parseInt(global.INFO.setting.ENABLE_TYPE_AUDIO) : 0;
				if (licenseUseTypeAudioAllow === 0) {
					callback(new Error('audio file is not allowed by license'), false);
					return;
				}
				maxSize = parseInt(global.INFO.setting['MAX_UPLOAD_AUDIO_SIZE'], 10);
				break;
			case constant.ASSET_TYPE_ENUM.VIDEO:
				const licenseUseTypeVideoAllow = global.INFO.setting?.['ENABLE_TYPE_VIDEO'] ? parseInt(global.INFO.setting.ENABLE_TYPE_VIDEO) : 0;
				if (licenseUseTypeVideoAllow === 0) {
					callback(new Error('video file is not allowed by license'), false);
					return;
				}
				maxSize = parseInt(global.INFO.setting['MAX_UPLOAD_VIDEO_SIZE'], 10);
				break;
			case constant.ASSET_TYPE_ENUM.IMAGE:
				const licenseUseTypeImageAllow = global.INFO.setting?.['ENABLE_TYPE_IMAGE'] ? parseInt(global.INFO.setting.ENABLE_TYPE_IMAGE) : 0;
				if (licenseUseTypeImageAllow === 0) {
					myLogger.info('image file is not allowed by license');
					callback(new Error('image file is not allowed by license'), false);
					return;
				}
				maxSize = parseInt(global.INFO.setting['MAX_UPLOAD_IMAGE_SIZE'], 10);
				break;
			case constant.ASSET_TYPE_ENUM.DOCUMENT:
				const licenseUseTypeDocumentAllow = global.INFO.setting?.['ENABLE_TYPE_DOCUMENT'] ? parseInt(global.INFO.setting.ENABLE_TYPE_DOCUMENT) : 0;
				if (licenseUseTypeDocumentAllow === 0) {
					callback(new Error('document file is not allowed by license'), false);
					return;
				}
				maxSize = parseInt(global.INFO.setting['MAX_UPLOAD_DOCUMENT_SIZE'], 10);
				break;
			default:
				const licenseUseType3DModalAllow = global.INFO.setting?.['ENABLE_TYPE_3D'] ? parseInt(global.INFO.setting.ENABLE_TYPE_3D) : 0;
				if (licenseUseType3DModalAllow === 0) {
					callback(new Error('document file is not allowed by license'), false);
					return;
				}
				maxSize = parseInt(global.INFO.setting['MAX_UPLOAD_OTHER_SIZE'], 10);
				break;
		}
		file.mimetype = objFileInfo.mimetype;
	} else {
		myLogger.info('can not find the suitable supported file format');
	}
	myLogger.info('maximum size of upload file: ' + maxSize);
	if (req.body.type !== constant.ASSET_TYPE_ENUM.NONE) {
		callback(null, true);
	} else {
		callback(new Error('Not supported'), false);
	}
};
