import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Phone, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PhoneVerificationProps {
  phone: string;
  onVerificationComplete: (verified: boolean) => void;
  onPhoneChange?: (phone: string) => void;
  disabled?: boolean;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  phone,
  onVerificationComplete,
  onPhoneChange,
  disabled = false
}) => {
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsOtpSent(true);
        setCountdown(300); // 5 minutes
        toast.success('OTP sent successfully!');
        console.log('OTP sent to:', phone, '- Check console for OTP');
      } else {
        setError(data.error || 'Failed to send OTP');
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('Failed to send OTP. Please try again.');
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        onVerificationComplete(true);
        toast.success('Phone number verified successfully!');
      } else {
        setError(data.error || 'Invalid OTP');
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError('Failed to verify OTP. Please try again.');
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resendOTP = () => {
    setOtp('');
    setIsOtpSent(false);
    setAttemptsLeft(3);
    sendOTP();
  };

  if (isVerified) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Phone number verified successfully!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Phone Verification</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOtpSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => onPhoneChange?.(e.target.value)}
                  disabled={disabled || isSending}
                  className="flex-1"
                />
                <Button 
                  onClick={sendOTP} 
                  disabled={isSending || disabled || !phone}
                  className="shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isVerifying || disabled}
                maxLength={6}
              />
              <p className="text-sm text-gray-600">
                OTP sent to {phone}
                {countdown > 0 && (
                  <span className="ml-2 text-blue-600">
                    (Expires in {formatCountdown(countdown)})
                  </span>
                )}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={verifyOTP} 
                disabled={isVerifying || !otp || otp.length !== 6}
                className="flex-1"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Verify OTP
              </Button>
              <Button
                variant="outline"
                onClick={resendOTP}
                disabled={countdown > 0 || isSending}
              >
                {countdown > 0 ? `Resend (${formatCountdown(countdown)})` : 'Resend OTP'}
              </Button>
            </div>

            {attemptsLeft < 3 && (
              <p className="text-sm text-orange-600">
                {attemptsLeft} attempts remaining
              </p>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PhoneVerification;