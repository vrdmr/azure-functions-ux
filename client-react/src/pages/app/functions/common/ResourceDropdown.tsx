import { FieldProps, FormikProps } from 'formik';
import { Callout, DirectionalHint, IDropdownOption, IDropdownProps, Link } from '@fluentui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessageOrStringify } from '../../../../ApiHelpers/ArmHelper';
import SiteService from '../../../../ApiHelpers/SiteService';
import Dropdown, { CustomDropdownProps } from '../../../../components/form-controls/DropDown';
import LoadingComponent from '../../../../components/Loading/LoadingComponent';
import { ArmObj } from '../../../../models/arm-obj';
import { BindingSetting, BindingSettingResource } from '../../../../models/functions/binding';
import { KeyValue } from '../../../../models/portal-models';
import { SiteStateContext } from '../../../../SiteState';
import { LogCategories } from '../../../../utils/LogCategories';
import LogService from '../../../../utils/LogService';
import SiteHelper from '../../../../utils/SiteHelper';
import StringUtils from '../../../../utils/string';
import { BindingEditorFormValues } from './BindingFormBuilder';
import { calloutStyleField, linkPaddingStyle, horizontalLinkPaddingStyle } from './callout/Callout.styles';
import { Layout } from '../../../../components/form-controls/ReactiveFormControl';
import NewAppSettingCallout from './callout/NewAppSettingCallout';
import NewDocumentDBConnectionCallout from './callout/NewDocumentDBConnectionCallout';
import NewEventHubConnectionCallout from './callout/NewEventHubConnectionCallout';
import NewServiceBusConnectionCallout from './callout/NewServiceBusConnectionCallout';
import NewStorageAccountConnectionCallout from './callout/NewStorageAccountConnectionCallout';

export interface ResourceDropdownProps {
  setting: BindingSetting;
  resourceId: string;
}

const ResourceDropdown: React.SFC<ResourceDropdownProps & CustomDropdownProps & FieldProps & IDropdownProps> = props => {
  const { setting, resourceId, form: formProps, field, isDisabled, layout } = props;
  const siteStateContext = useContext(SiteStateContext);
  const { t } = useTranslation();

  const [appSettings, setAppSettings] = useState<ArmObj<KeyValue<string>> | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<IDropdownOption | undefined>(undefined);
  const [newAppSetting, setNewAppSetting] = useState<{ key: string; value: string } | undefined>(undefined);
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);
  const [shownMissingOptionError, setShownMissingOptionError] = useState<boolean>(false);

  useEffect(() => {
    SiteService.fetchApplicationSettings(resourceId).then(r => {
      if (!r.metadata.success) {
        LogService.error(
          LogCategories.bindingResource,
          'getAppSettings',
          `Failed to get appSettings: ${getErrorMessageOrStringify(r.metadata.error)}`
        );
        return;
      }
      setAppSettings(r.data);
    });
  }, [resourceId]);

  // If we are readonly, don't rely on app settings, assume that the saved value is correct
  if (SiteHelper.isFunctionAppReadOnly(siteStateContext.siteAppEditState)) {
    return <Dropdown selectedKey={field.value} {...props} options={[{ text: field.value, key: field.value }]} />;
  }

  if (!appSettings) {
    return <LoadingComponent />;
  }

  const options = filterResourcesFromAppSetting(setting, appSettings.properties, newAppSetting && newAppSetting.key);
  const appSettingKeys = Object.keys(appSettings.properties);

  // Set the onload value
  if (!field.value && options.length > 0) {
    formProps.setFieldValue(field.name, options[0].key);
  }

  // Set the value when coming back from the callout
  if (selectedItem) {
    onChange(selectedItem, formProps, field, appSettings);
    setSelectedItem(undefined);
  }

  if (field.value && !options.some(option => option.key === field.value) && !shownMissingOptionError) {
    formProps.setFieldError(field.name, t('resourceDropdown_missingAppSetting'));
    setShownMissingOptionError(true);
  }

  return (
    <div>
      <Dropdown
        placeholder={options.length < 1 ? t('resourceDropdown_noAppSettingsFound') : undefined}
        onChange={(_e, option) => onChange(option, formProps, field, appSettings)}
        {...props}
        options={options}
      />
      {!isDisabled ? (
        <div style={layout === Layout.Vertical ? linkPaddingStyle : horizontalLinkPaddingStyle}>
          <Link id="target" onClick={() => setIsDialogVisible(true)}>
            {'New'}
          </Link>
          <Callout
            onDismiss={() => setIsDialogVisible(false)}
            target={'#target'}
            hidden={!isDialogVisible}
            style={calloutStyleField}
            directionalHint={DirectionalHint.bottomCenter}>
            {setting.resource === BindingSettingResource.Storage && (
              <NewStorageAccountConnectionCallout
                appSettingKeys={appSettingKeys}
                setNewAppSetting={setNewAppSetting}
                setSelectedItem={setSelectedItem}
                setIsDialogVisible={setIsDialogVisible}
                {...props}
                layout={Layout.Vertical} // Layout needs to be here or it gets overridden from props
                multiline={false} // Same as above, here to overwrite prop
                resourceId={resourceId}
              />
            )}
            {setting.resource === BindingSettingResource.EventHub && (
              <NewEventHubConnectionCallout
                appSettingKeys={appSettingKeys}
                setNewAppSetting={setNewAppSetting}
                setSelectedItem={setSelectedItem}
                setIsDialogVisible={setIsDialogVisible}
                {...props}
                layout={Layout.Vertical} // Layout needs to be here or it gets overridden from props
                multiline={false} // Same as above, here to overwrite prop
                resourceId={resourceId}
              />
            )}
            {setting.resource === BindingSettingResource.ServiceBus && (
              <NewServiceBusConnectionCallout
                appSettingKeys={appSettingKeys}
                setNewAppSetting={setNewAppSetting}
                setSelectedItem={setSelectedItem}
                setIsDialogVisible={setIsDialogVisible}
                {...props}
                layout={Layout.Vertical} // Layout needs to be here or it gets overridden from props
                multiline={false} // Same as above, here to overwrite prop
                resourceId={resourceId}
              />
            )}
            {setting.resource === BindingSettingResource.DocumentDB && (
              <NewDocumentDBConnectionCallout
                appSettingKeys={appSettingKeys}
                setNewAppSetting={setNewAppSetting}
                setSelectedItem={setSelectedItem}
                setIsDialogVisible={setIsDialogVisible}
                {...props}
                layout={Layout.Vertical} // Layout needs to be here or it gets overridden from props
                multiline={false} // Same as above, here to overwrite prop
                resourceId={resourceId}
              />
            )}
            {setting.resource === BindingSettingResource.AppSetting && (
              <NewAppSettingCallout
                appSettingKeys={appSettingKeys}
                setNewAppSetting={setNewAppSetting}
                setSelectedItem={setSelectedItem}
                setIsDialogVisible={setIsDialogVisible}
                {...props}
                resourceId={resourceId}
              />
            )}
          </Callout>
        </div>
      ) : (
        undefined
      )}
    </div>
  );
};

const onChange = (
  option: IDropdownOption | undefined,
  formProps: FormikProps<BindingEditorFormValues>,
  field: { name: string; value: any },
  appSettings: ArmObj<KeyValue<string>>
) => {
  if (option) {
    // Make sure the value is saved to the form
    const appSettingName = option.key;
    formProps.setFieldValue(field.name, appSettingName);

    // Set new App Settings if a PUT is required to update them
    if (option.data) {
      const newAppSettings = appSettings;
      newAppSettings.properties[option.key] = option.data;
      formProps.setFieldValue('newAppSettings', newAppSettings);
    } else {
      formProps.setFieldValue('newAppSettings', null);
    }
  }
};

const filterResourcesFromAppSetting = (
  setting: BindingSetting,
  appSettings: KeyValue<string>,
  newAppSettingName?: string
): IDropdownOption[] => {
  switch (setting.resource) {
    case BindingSettingResource.Storage:
      return getStorageSettings(appSettings, newAppSettingName);
    case BindingSettingResource.EventHub:
    case BindingSettingResource.ServiceBus:
      return getEventHubAndServiceBusSettings(appSettings, newAppSettingName);
    case BindingSettingResource.AppSetting:
      return getAppSettings(appSettings, newAppSettingName);
    case BindingSettingResource.DocumentDB:
      return getDocumentDBSettings(appSettings, newAppSettingName);
  }
  return [];
};

const getStorageSettings = (appSettings: KeyValue<string>, newAppSettingName?: string): IDropdownOption[] => {
  const result: IDropdownOption[] = newAppSettingName ? [{ text: `${newAppSettingName} (new)`, key: newAppSettingName }] : [];

  for (const key of Object.keys(appSettings)) {
    const value = appSettings[key].toLowerCase();
    if (value.indexOf('accountname') > -1 && value.indexOf('accountkey') > -1 && key !== newAppSettingName) {
      result.push({ key, text: key });
    }
  }
  return result;
};

const getEventHubAndServiceBusSettings = (appSettings: KeyValue<string>, newAppSettingName?: string): IDropdownOption[] => {
  const result: IDropdownOption[] = newAppSettingName ? [{ text: `${newAppSettingName} (new)`, key: newAppSettingName }] : [];

  for (const key of Object.keys(appSettings)) {
    const value = appSettings[key].toLowerCase();
    if (value.indexOf('sb://') > -1 && value.indexOf('sharedaccesskeyname') > -1) {
      result.push({ key, text: key });
    }
  }
  return result;
};

const getAppSettings = (appSettings: KeyValue<string>, newAppSettingName?: string): IDropdownOption[] => {
  const result: IDropdownOption[] = newAppSettingName ? [{ text: `${newAppSettingName} (new)`, key: newAppSettingName }] : [];

  for (const key of Object.keys(appSettings)) {
    result.push({ key, text: key });
  }

  return result;
};

const getDocumentDBSettings = (appSettings: KeyValue<string>, newAppSettingName?: string): IDropdownOption[] => {
  const result: IDropdownOption[] = newAppSettingName ? [{ text: `${newAppSettingName} (new)`, key: newAppSettingName }] : [];

  for (const key of Object.keys(appSettings)) {
    const value = appSettings[key].toLowerCase();
    if (value.indexOf('accountendpoint') > -1 && value.indexOf('documents') > -1) {
      result.push({ key, text: key });
    }
  }
  return result;
};

export const generateAppSettingName = (existingAppSettingKeys: string[], defaultAppSettingName: string): string => {
  let appSettingName = defaultAppSettingName;
  let count = 1;

  while (
    // eslint-disable-next-line no-loop-func
    existingAppSettingKeys.some(appSettingKey => {
      return StringUtils.equalsIgnoreCase(appSettingKey, appSettingName);
    })
  ) {
    count += 1;

    appSettingName = `${defaultAppSettingName}${count}`;
  }

  return appSettingName;
};

export default ResourceDropdown;
