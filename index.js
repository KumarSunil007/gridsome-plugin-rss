const RSS = require("rss");
const fs = require("fs");
const path = require("path");

module.exports = function (api, options) {
  let articleData = [];
  let storeInstance = null;
  api.loadSource((store) => {
    storeInstance = store;
    // May be collection is not ready yet
    // const storedData = store.getCollection(options.contentTypeName);
    // if (storedData && storedData.collection)
    //   this.articleData = [...storedData.collection.data];
  });

  api.afterBuild(({ config }) => {
    if (storeInstance) {
      const storedData = storeInstance.getCollection(options.contentTypeName);
      if (storedData && storedData.collection) {
        articleData = [...storedData.collection.data];
        this.articleData = articleData;
      }
    }

    const feed = new RSS(options.feedOptions);
    const dateField = options.dateField || "date";

    let collectionData = this.articleData || [];

    const collectionWithValidDates = collectionData.filter(
      (node) => !isNaN(new Date(node[dateField]).getTime())
    );
    if (collectionWithValidDates.length === collectionData.length) {
      collectionData.sort((nodeA, nodeB) => {
        if (options.latest) {
          return (
            new Date(nodeB[dateField]).getTime() -
            new Date(nodeA[dateField]).getTime()
          );
        } else {
          return (
            new Date(nodeA[dateField]).getTime() -
            new Date(nodeB[dateField]).getTime()
          );
        }
      });
    }

    if (options.filterItems) {
      collectionData = collectionData.filter((item, index) =>
        options.filterItems(item, index)
      );
    }

    if (options.maxItems) {
      collectionData = collectionData.filter(
        (item, index) => index < options.maxItems
      );
    }

    collectionData.forEach((item) => {
      feed.item(options.feedItemOptions(item));
    });

    const output = {
      dir: config.outputDir || "./dist",
      name: "rss.xml",
      ...options.output
    };

    const outputPath = path.resolve(process.cwd(), output.dir);
    const outputPathExists = fs.existsSync(outputPath);
    const fileName = output.name.endsWith(".xml")
      ? output.name
      : `${output.name}.xml`;

    if (!outputPathExists) {
      fs.mkdirSync(outputPath);
    }
    fs.writeFileSync(
      path.resolve(process.cwd(), output.dir, fileName),
      feed.xml()
    );
  });
};
