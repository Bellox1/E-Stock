<x-mail::message>
# Confirmation de modification

Bonjour,

Vous avez demandé la modification de vos informations personnelles (Email ou Téléphone) sur votre compte **Gestion Stock**.

Veuillez utiliser le code de confirmation suivant pour valider ces changements :

<x-mail::panel>
## {{ $otp }}
</x-mail::panel>

Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail. Vos informations resteront inchangées.

Merci,<br>
L'équipe {{ config('app.name') }}
</x-mail::message>
