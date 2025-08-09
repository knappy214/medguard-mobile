import React from 'react'
import { Linking, View } from 'react-native'
import { Modal, Card, Text, Button, Divider } from '@ui-kitten/components'
import i18n from '../../i18n'

export interface ConsentModalProps {
  visible: boolean
  onAccept: () => void
  onDecline: () => void
  onDismiss?: () => void
}

export default function ConsentModal({ visible, onAccept, onDecline, onDismiss }: ConsentModalProps) {
  const openPrivacy = () => Linking.openURL('https://medguard-sa.com/privacy')
  const openTerms = () => Linking.openURL('https://medguard-sa.com/terms')

  const t = (k: string) => i18n.t(k)

  return (
    <Modal visible={visible} backdropStyle={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onBackdropPress={onDismiss}>
      <Card disabled>
        <Text category="h6" style={{ marginBottom: 8 }}>{t('privacy.consent_title')}</Text>
        <Text category="s1" style={{ marginBottom: 12 }}>{t('privacy.consent_description')}</Text>
        <Divider style={{ marginVertical: 8 }} />
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text>• {t('privacy.consent_personalInfo')}</Text>
          <Text>• {t('privacy.consent_healthInfo')}</Text>
          <Text>• {t('privacy.consent_sharing')}</Text>
          <Text>• {t('privacy.consent_retention')}</Text>
          <Text>• {t('privacy.consent_rights')}</Text>
          <Text>• {t('privacy.consent_lawfulBasis')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Button appearance="ghost" size="small" onPress={openPrivacy}>{t('common.privacy')}</Button>
          <Button appearance="ghost" size="small" onPress={openTerms}>{t('common.terms')}</Button>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Button appearance="ghost" onPress={onDecline}>{t('privacy.decline')}</Button>
          <Button onPress={onAccept}>{t('privacy.accept')}</Button>
        </View>
      </Card>
    </Modal>
  )
}


