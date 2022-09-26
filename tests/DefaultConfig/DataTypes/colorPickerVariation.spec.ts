import {expect} from "@playwright/test";
import {AliasHelper, ConstantHelper, test} from '../../../lib';
import {
  DocumentTypeBuilder,
  TextBoxDataTypeBuilder,
  ApprovedColorPickerDataTypeBuilder, ContentBuilder
} from "@umbraco/playwright-models";

test.describe('Vary by culture for Color Picker', () => {

  async function createContentWithColorsForTwoLanguages(umbracoApi, documentName, colorPickerName, languageDa, languageEn, daColor, enColor,) {
    const randomColor = "f1c232";
    const alias = AliasHelper.toAlias(documentName);

    const pickerDataType = new ApprovedColorPickerDataTypeBuilder()
      .withName(colorPickerName)
      .withPrevalues([enColor, daColor, randomColor])
      .build()

    await umbracoApi.dataTypes.save(pickerDataType).then(async (response) => {
      const rootDocType = new DocumentTypeBuilder()
        .withName(documentName)
        .withAlias(alias)
        .withAllowAsRoot(true)
        .withAllowCultureVariation(true)
        .withDefaultTemplate(alias)
        .addGroup()
        .withName("CustomColorPicker")
        .addCustomProperty(response.id)
        .withAlias("colors")
        .withCultureVariant(true)
        .done()
        .done()
        .build();
      await umbracoApi.documentTypes.save(rootDocType).then(async (generatedRootDocType) => {
        const childContentNode = new ContentBuilder()
          .withContentTypeAlias(generatedRootDocType["alias"])
          .withAction("publishNew")
          .addVariant()
          .withCulture(languageDa)
          .withName(languageDa)
          .withSave(true)
          .withPublish(false)
          .addProperty()
          .withAlias("colors")
          .withValue(daColor)
          .done()
          .done()
          .addVariant()
          .withCulture(languageEn)
          .withName(languageEn)
          .withSave(true)
          .withPublish(false)
          .addProperty()
          .withAlias("colors")
          .withValue(enColor)
          .done()
          .done()
          .build();
        await umbracoApi.content.save(childContentNode);
      });
    });
  }

  test.beforeEach(async ({page, umbracoApi, umbracoUi}) => {
    await umbracoApi.login();
  });
  test('create documentType with vary by culture with UI with a colorPicker property which also has vary by culture', async ({page, umbracoApi, umbracoUi}) => {
    const documentTypeName = 'TestDocument';
    const colorPickerPropertyName = 'ColorPicker';
    const groupName = 'colorGroup';
    const colorPickerName = 'CustomColorPicker';

    await umbracoApi.documentTypes.ensureNameNotExists(documentTypeName);
    await umbracoApi.templates.ensureNameNotExists(documentTypeName);

    await umbracoUi.goToSection(ConstantHelper.sections.settings);

    // Creates document with a template
    await page.locator('[data-element="tree-item-options"]',{hasText: "Open context menu for Document Types"}).click();
    await page.locator('[data-element="action-documentType"]').click();

    await page.locator('[data-element="editor-name-field"]').type(documentTypeName);

    await umbracoUi.updateDocumentPermissionsToAllowCultureVariant();

    // Adds a group with a Custom ColorPicker editor
    await page.locator('[data-element="group-add"]').click();
    await page.locator('[data-element="group-name"]').type(groupName);
    await page.locator('[key="contentTypeEditor_addProperty"]').click();
    await page.locator('[data-element="property-name"]').type(colorPickerPropertyName);
    await page.locator('[data-element="editor-add"]').click();
    await page.locator('[data-element="datatype-Color Picker"]').click();
    await page.locator('[title="Create a new configuration of Color Picker"]').click();
    await page.locator('[id="dataTypeName"]').fill(colorPickerName);
    // Adds color to ColorPicker
    await page.locator('[key="general_add"]').click();
    // Adds color to ColorPicker
    await page.locator('[options="options"]').click();
    await page.locator('[title="#f44336"]').click();
    await page.locator('.sp-choose').click();
    await page.locator('[key="general_add"]').click();
    await page.locator('[data-element="button-submit"]').nth(1).click();
    // Needs to wait for the other button do disappear 
    await page.waitForTimeout(100);
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submit));

    // Assert
    await expect(page.locator('.umb-notifications__notifications > .alert-success')).toBeVisible();

    // Clean
    await umbracoApi.documentTypes.ensureNameNotExists(documentTypeName);
    await umbracoApi.templates.ensureNameNotExists(documentTypeName);
  });

  test('create content with two languages with different colors', async ({page, umbracoApi, umbracoUi}) => {
    const documentName = "TestDocument";
    const languageEn = 'en-US';
    const languageDa = 'da';
    const enColor = "000000";
    const daColor = "FF0000";
    const randomColor = "f1c232";
    const alias = AliasHelper.toAlias(documentName);
    const colorPickerName = 'CustomColorPicker';

    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(documentName);
    await umbracoApi.dataTypes.ensureNameNotExists(colorPickerName);
    await umbracoApi.languages.ensureCultureNotExists(languageDa);
    await umbracoApi.templates.ensureNameNotExists(documentName);

    await umbracoApi.languages.createLanguage(languageDa, false, 1);

    const pickerDataType = new ApprovedColorPickerDataTypeBuilder()
      .withName(colorPickerName)
      .withPrevalues([enColor, daColor, randomColor])
      .build()

    await umbracoApi.dataTypes.save(pickerDataType).then(async (response) => {
      const rootDocType = new DocumentTypeBuilder()
        .withName(documentName)
        .withAlias(alias)
        .withAllowAsRoot(true)
        .withAllowCultureVariation(true)
        .withDefaultTemplate(alias)
        .addGroup()
        .withName("CustomColorPicker")
        .addCustomProperty(response.id)
        .withAlias("colors")
        .withCultureVariant(true)
        .done()
        .done()
        .build();
      await umbracoApi.documentTypes.save(rootDocType)
    });

    await umbracoUi.goToSection(ConstantHelper.sections.content);

    // Creates document with a template
    await page.locator('[element="tree-item-options"]', {hasText: "Open context node for Content"}).click();
    await page.locator('.umb-action-link').click();
    await page.locator('[data-element="editor-name-field"]').type(languageEn);

    // Selects color for the English version and saves it
    await page.locator('[title="#' + enColor + '"]').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
    await page.locator('[alias="overlaySubmit"]').click();

    // Switches to Danish culture
    await umbracoUi.switchCultureInContent("Danish");
    await page.locator('[data-element="editor-name-field"]').type(languageDa);

    // Selects color for the Danish version and saves it
    await page.locator('[title="#' + daColor + '"]').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
    await page.locator('[alias="overlaySubmit"]').click();

    await page.reload();
    // Needs to close tours when page has reloaded
    // await page.click('.umb-tour-step__close');

    // Assert

    // Assert that the correct color is selected, the svg is the checkmark. This is not great, but the only choice we got
    await expect(page.locator('[title="#' + daColor +'"] >> svg')).toBeVisible();

    // Clean
    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(documentName);
    await umbracoApi.dataTypes.ensureNameNotExists(colorPickerName);
    await umbracoApi.languages.ensureCultureNotExists(languageDa);
    await umbracoApi.templates.ensureNameNotExists(documentName);
  });

  test('publish content with two languages with different colors', async ({page, umbracoApi, umbracoUi}) => {
    const documentName = "TestDocument";
    const languageEn = 'en-US';
    const languageDa = 'da';
    const enColor = "000000";
    const daColor = "FF0000";
    const colorPickerName = 'CustomColorPicker';

    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(documentName);
    await umbracoApi.dataTypes.ensureNameNotExists(colorPickerName);
    await umbracoApi.languages.ensureCultureNotExists(languageDa);
    await umbracoApi.templates.ensureNameNotExists(documentName);

    await umbracoApi.languages.createLanguage(languageDa, false, 1);

    await createContentWithColorsForTwoLanguages(umbracoApi, documentName, colorPickerName, languageDa, languageEn, daColor, enColor);

    await umbracoUi.refreshContentTree();

    // Opens content
    await page.locator('[data-element="tree-item-' + languageEn + '"]').click();

    // Publishes both languages
    await page.locator('[label-key="buttons_morePublishingOptions"]').click();
    await page.locator('.umb-list-item', {hasText: "Danish"}).locator('.umb-form-check__check').click();
    await page.locator('[alias="overlaySubmit"]').click();

    // Assert
    await expect(page.locator('.umb-notifications__notifications > .alert-success', {hasText: "English"})).toBeVisible();
    await expect(page.locator('.umb-notifications__notifications > .alert-success', {hasText: "Danish"})).toBeVisible();

    // Clean 
    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(documentName);
    await umbracoApi.dataTypes.ensureNameNotExists(colorPickerName);
    await umbracoApi.languages.ensureCultureNotExists(languageDa);
    await umbracoApi.templates.ensureNameNotExists(documentName);
  });

  // test('Check if content for two languages is published on domains with their own colors', async ({page, umbracoApi, umbracoUi}) => {
  //
  // });
});