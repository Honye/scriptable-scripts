// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: images; icon-color: cyan; share-sheet-inputs: file-url,url,image,plain-text;
/**
 *
 * @version 1.0.0
 * @author Honye
 */

/**
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {Array<{ title: string; [key: string]: any }>} options.options
 * @param {boolean} [options.showCancel = true]
 * @param {string} [options.cancelText = 'Cancel']
 */
async function presentSheet (options) {
  options = {
    showCancel: true,
    cancelText: 'Cancel',
    ...options
  };
  const alert = new Alert();
  if (options.title) {
    alert.title = options.title;
  }
  if (options.message) {
    alert.message = options.message;
  }
  if (!options.options) {
    throw new Error('The "options" property of the parameter cannot be empty')
  }
  for (const option of options.options) {
    alert.addAction(option.title);
  }
  if (options.showCancel) {
    alert.addCancelAction(options.cancelText);
  }
  const value = await alert.presentSheet();
  return {
    value,
    option: options.options[value]
  }
}

/**
 * @param {{[language: string]: string} | string[]} langs
 */
const i18n = (langs) => {
  const language = Device.language();
  if (Array.isArray(langs)) {
    langs = {
      en: langs[0],
      zh: langs[1],
      others: langs[0]
    };
  } else {
    langs.others = langs.others || langs.en;
  }
  return langs[language] || langs.others
};

const localFile = FileManager.local();
const APP_ROOT = localFile.joinPath(localFile.documentsDirectory(), Script.name());
const PHOTOS_DIR = localFile.joinPath(APP_ROOT, 'photos');

const main = async () => {
  if (!localFile.fileExists(PHOTOS_DIR)) {
    localFile.createDirectory(PHOTOS_DIR, true);
  }

  if (config.runsInActionExtension) {
    choosePhotos();
    return
  }

  if (config.runsInApp) {
    const {
      option: { key } = {}
    } = await presentSheet({
      options: [
        {
          title: i18n(['Preview', '预览']),
          key: 'preview'
        },
        {
          title: i18n(['Photos', '查看图片']),
          key: 'photos'
        }
      ],
      cancelText: i18n(['Cancel', '取消'])
    });
    if (key === 'preview') {
      const widget = createWidget();
      widget.presentSmall();
      Script.complete();
      return
    }
    if (key === 'photos') {
      presentAlbums();
      return
    }
  }

  if (config.runsInWidget) {
    const widget = createWidget();
    Script.setWidget(widget);
    Script.complete();
  }
};

/** 通过分享菜单选择照片 */
const choosePhotos = async () => {
  const albums = getAlbums();
  let album;
  const { option } = await presentSheet({
    message: i18n([
      'Choose Album',
      '选择相册'
    ]),
    options: [
      ...albums.map((name) => ({ title: name, type: 'album' })),
      {
        title: i18n(['New Album', '新建相册']),
        type: 'new'
      }
    ]
  });
  if (option) {
    if (option.type === 'album') {
      album = option.title;
    }
    if (option.type === 'new') {
      album = await createAlbum();
    }
  }
  const albumDir = localFile.joinPath(PHOTOS_DIR, album);

  const filePaths = args.fileURLs;
  const images = args.images;
  if (filePaths && filePaths.length) { // 图片文件分享
    for (const filePath of filePaths) {
      const filename = localFile.fileName(filePath, true);
      const copyPath = localFile.joinPath(albumDir, filename);
      try {
        localFile.copy(filePath, copyPath);
      } catch (e) {
        await alert(e.message);
      }
    }
  } else if (images && images.length) { // 图片分享
    for (const image of images) {
      const filePath = localFile.joinPath(albumDir, `${Date.now()}.jpg`);
      localFile.writeImage(filePath, image);
    }
  }

  presentPhotos(album);
};

/**
 * @param {string} album
 */
const _choosePhoto = async (album) => {
  const {
    option: { key } = {}
  } = await presentSheet({
    options: [
      {
        title: i18n(['Camera', '拍照']),
        key: 'camera'
      },
      {
        title: i18n(['Albums', '相册']),
        key: 'album'
      }
    ]
  });
  const image = await (async () => {
    if (key === 'camera') {
      return await Photos.fromCamera()
    }
    if (key === 'album') {
      return await Photos.fromLibrary()
    }
  })();
  const filename = `${Date.now().toString()}.jpg`;
  const albumDir = localFile.joinPath(PHOTOS_DIR, album);
  const filePath = localFile.joinPath(albumDir, filename);
  localFile.writeImage(filePath, image);
  return filePath
};

const getAlbums = () => {
  const albums = localFile.listContents(PHOTOS_DIR)
    .filter((name) => localFile.isDirectory(localFile.joinPath(PHOTOS_DIR, name)));
  return albums
};

/** 添加相册 */
const createAlbum = async () => {
  const alert = new Alert();
  alert.title = i18n(['New Album', '新建相册']);
  alert.addTextField(i18n(['Input the album name', '输入相册名']));
  alert.addAction(i18n(['Save', '保存']));
  alert.addCancelAction(i18n(['Cancel', '取消']));
  const index = await alert.presentAlert();
  if (index === 0) {
    const name = alert.textFieldValue(0);
    localFile.createDirectory(
      localFile.joinPath(PHOTOS_DIR, name),
      true
    );
    return { name }
  }
};

/**
 * @param {string} album
 */
const getPhotos = (album) => {
  const dir = localFile.joinPath(PHOTOS_DIR, album);
  return localFile.listContents(dir)
    .map((filename) => {
      const albumDir = localFile.joinPath(PHOTOS_DIR, album);
      return localFile.joinPath(albumDir, filename)
    })
};

const createWidget = () => {
  let [album] = (args.widgetParameter || '').split(',').map(str => str.trim());
  const widget = new ListWidget();
  if (!album) {
    const albums = getAlbums();
    if (albums.length > 0) {
      album = albums[0];
    } else {
      widget.addText(i18n(['Go to APP set photos', '请先去 APP 选择照片']));
      return widget
    }
  }
  const photos = getPhotos(album);
  const length = photos.length;
  if (length > 0) {
    const index = Math.floor(Math.random() * length);
    const image = localFile.readImage(photos[index]);
    widget.backgroundImage = image;
  } else {
    widget.addText(i18n([`Album "${album}" is empty`, `相册"${album}"是空的`]));
  }
  return widget
};

/** 展示相册列表 */
const presentAlbums = () => {
  const albums = localFile.listContents(PHOTOS_DIR)
    .filter((name) => localFile.isDirectory(localFile.joinPath(PHOTOS_DIR, name)));
  const table = new UITable();
  const head = new UITableRow();
  table.addRow(head);
  head.isHeader = true;
  head.addText(i18n(['Albums', '相册']));
  // 添加相册
  const cellNew = head.addButton(i18n(['New Album', '新建相册']));
  cellNew.rightAligned();
  cellNew.onTap = async () => {
    const alert = new Alert();
    alert.title = i18n(['New Album', '新建相册']);
    alert.addTextField(i18n(['Input the album name', '输入相册名']));
    alert.addAction(i18n(['Save', '保存']));
    alert.addCancelAction(i18n(['Cancel', '取消']));
    const index = await alert.presentAlert();
    if (index === 0) {
      const name = alert.textFieldValue(0);
      localFile.createDirectory(
        localFile.joinPath(PHOTOS_DIR, name),
        true
      );
      addRow(name);
      table.reload();
    }
  };
  const addRow = (album) => {
    const row = new UITableRow();
    table.addRow(row);
    const count = localFile.listContents(
      localFile.joinPath(PHOTOS_DIR, album)
    ).length;
    const cellName = row.addText(album, `${count} photos`);
    cellName.subtitleColor = new Color('#888888');
    const cellView = row.addButton(i18n(['View', '查看']));
    cellView.onTap = () => presentPhotos(album);
    const cellDelete = row.addButton(i18n(['Delete', '删除']));
    cellDelete.onTap = async () => {
      const alert = new Alert();
      alert.message = i18n([`Are you sure delete "${album}"?`, `确定删除"${album}"吗？`]);
      alert.addAction(i18n(['Delete', '删除']));
      alert.addCancelAction(i18n(['Cancel', '取消']));
      const value = await alert.presentAlert();
      if (value === 0) {
        localFile.remove(localFile.joinPath(PHOTOS_DIR, album));
        table.removeRow(row);
        table.reload();
      }
    };
  };
  for (const [, album] of albums.entries()) {
    addRow(album);
  }
  table.present();
};

/**
 * 展示相册照片
 * @param {string}
 */
const presentPhotos = (album) => {
  const photos = getPhotos(album);
  const table = new UITable();
  const head = new UITableRow();
  table.addRow(head);
  head.isHeader = true;
  head.addText(i18n(['Photos', '照片']));
  const cellChoose = head.addButton(i18n(['Choose photos', '选择图片']));
  cellChoose.rightAligned();
  cellChoose.onTap = async () => {
    const filePath = await _choosePhoto(album);
    addRow(filePath);
    table.reload();
  };

  const addRow = (filePath) => {
    const row = new UITableRow();
    table.addRow(row);
    const image = Image.fromFile(filePath);
    const cellImage = row.addImage(image);
    cellImage.widthWeight = 4;
    const dfm = new DateFormatter();
    dfm.dateFormat = 'yy-MM-dd HH:mm:ss';
    const cellName = row.addText(
      localFile.fileName(filePath, true),
      dfm.string(localFile.modificationDate(filePath))
    );
    cellName.widthWeight = 10;
    cellName.titleFont = Font.systemFont(14);
    cellName.subtitleFont = Font.lightSystemFont(10);
    const buttonPreview = row.addButton(i18n(['Preview', '查看大图']));
    buttonPreview.widthWeight = 6;
    buttonPreview.rightAligned();
    buttonPreview.onTap = () => {
      QuickLook.present(image, true);
    };
    const buttonDelete = row.addButton(i18n(['Delete', '删除']));
    buttonDelete.widthWeight = 4;
    buttonDelete.rightAligned();
    buttonDelete.onTap = () => {
      localFile.remove(filePath);
      table.removeRow(row);
      table.reload();
    };
  };

  for (const filePath of photos) {
    addRow(filePath);
  }
  QuickLook.present(table);
};

const alert = (message, title = '') => {
  const alertIns = new Alert();
  alertIns.title = title;
  alertIns.message = String(message);
  return alertIns.present()
};

await main();
